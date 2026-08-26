"""Two writers at once — the cases a single-threaded test cannot reach.

The naming search and the cap both read the account's builds and then insert. Between those
two steps another request can do the same thing, so what protects them is a row lock on the
account plus a unique constraint underneath. Both are asserted here by really racing.
"""

import threading
from collections.abc import Iterator
from concurrent.futures import ThreadPoolExecutor
from typing import Any
from uuid import UUID

import pytest
from sqlalchemy import Engine, create_engine
from sqlalchemy.orm import sessionmaker

from app.exceptions.errors import AppError
from app.repositories import users as users_repo
from app.services import builds as builds_service

pytestmark = pytest.mark.integration


@pytest.fixture
def engine(migrated_db: None) -> Iterator[Engine]:
    from app.core.config import get_settings

    # * Room for both threads to hold a connection at once, or the second would wait on the pool rather than on the lock and the race would never happen.
    engine = create_engine(get_settings().database_url_direct, pool_size=5)
    try:
        yield engine
    finally:
        engine.dispose()


@pytest.fixture
def owner(engine: Engine) -> UUID:
    with sessionmaker(bind=engine)() as session:
        user = users_repo.upsert_by_firebase_uid(
            session,
            firebase_uid="uid-ann",
            google_sub="google-ann",
            email="ann@example.com",
            display_name="Ann",
        )
        session.commit()

        return user.id


def _create(engine: Engine, owner_id: UUID, name: str) -> Any:
    """One create in its own session, as a separate request would run it."""
    with sessionmaker(bind=engine)() as session:
        try:
            build = builds_service.insert_named(session, owner_id, name, {"v": 1})
            session.commit()

            return build.name
        except AppError as error:
            session.rollback()

            return error.code


def _race(engine: Engine, owner_id: UUID, name: str, times: int = 2) -> list[Any]:
    with ThreadPoolExecutor(max_workers=times) as pool:
        return [
            future.result()
            for future in [
                pool.submit(_create, engine, owner_id, name) for _ in range(times)
            ]
        ]


def test_two_creates_of_one_name_suffix_rather_than_collide(
    engine: Engine, owner: UUID
) -> None:
    # ! Without the row lock both would find "Main" free and the second would die on the unique constraint — a 500 where the contract promises a suffixed name.
    assert sorted(_race(engine, owner, "Main")) == ["Main", "Main (2)"]


def test_five_creates_of_one_name_take_five_distinct_names(
    engine: Engine, owner: UUID
) -> None:
    results = _race(engine, owner, "Main", times=5)

    assert sorted(results) == ["Main", "Main (2)", "Main (3)", "Main (4)", "Main (5)"]


def test_the_cap_holds_when_two_requests_reach_it_together(
    engine: Engine, owner: UUID
) -> None:
    with sessionmaker(bind=engine)() as session:
        for index in range(builds_service.MAX_BUILDS - 1):
            builds_service.insert_named(session, owner, f"build-{index}", {"v": 1})
        session.commit()

    results = _race(engine, owner, "last")

    # * Exactly one slot was left, so exactly one create takes it and the other is refused.
    assert sorted(str(result) for result in results) == ["build_limit", "last"]

    with sessionmaker(bind=engine)() as session:
        from app.repositories import builds as builds_repo

        assert builds_repo.count_for_owner(session, owner) == builds_service.MAX_BUILDS


def _patch(engine: Engine, owner_id: UUID, build_id: UUID, etag: str, name: str) -> Any:
    """One PATCH in its own session, holding an ETag another writer may already have used."""
    from app.schemas.builds import UpdateBuildIn

    with sessionmaker(bind=engine)() as session:
        try:
            build = builds_service.update_build(
                session, owner_id, build_id, etag, UpdateBuildIn(name=name)
            )

            return build.name
        except builds_service.StaleBuildError:
            session.rollback()

            return "stale"


def test_only_one_of_two_writers_holding_one_etag_wins(
    engine: Engine, owner: UUID
) -> None:
    from app.schemas.builds import render_timestamp

    with sessionmaker(bind=engine)() as session:
        build = builds_service.insert_named(session, owner, "Main", {"v": 1})
        session.commit()
        build_id, held = build.id, render_timestamp(build.updated_at)

    with ThreadPoolExecutor(max_workers=2) as pool:
        results = [
            future.result()
            for future in [
                pool.submit(_patch, engine, owner, build_id, held, name)
                for name in ("Ann's", "Bob's")
            ]
        ]

    # * Two devices that both read the same version and both saved. Whichever order they
    # * really interleaved in, exactly one write lands and the other is told, never dropped.
    assert sorted(results) in (["Ann's", "stale"], ["Bob's", "stale"])


def test_the_guarded_update_settles_a_write_the_service_check_let_through(
    engine: Engine, owner: UUID
) -> None:
    """Both writers past the service's fast path, colliding on the statement itself.

    `update_build` compares the caller's `If-Match` against a build it just read, which
    catches a stale save in the ordinary case. It cannot catch the case where both writers
    read the same version before either wrote — the guarded UPDATE is what settles that, and
    a barrier is what makes the two arrive there together instead of by luck.
    """
    from app.repositories import builds as builds_repo

    with sessionmaker(bind=engine)() as session:
        build = builds_service.insert_named(session, owner, "Main", {"v": 1})
        session.commit()
        build_id, held = build.id, build.updated_at

    gate = threading.Barrier(2)

    def write(name: str) -> bool:
        with sessionmaker(bind=engine)() as session:
            gate.wait(timeout=10)
            won = (
                builds_repo.update_guarded(
                    session,
                    build_id=build_id,
                    owner_id=owner,
                    expected_updated_at=held,
                    name=name,
                    data={"v": 1},
                )
                is not None
            )
            session.commit()

            return won

    with ThreadPoolExecutor(max_workers=2) as pool:
        won = [
            future.result()
            for future in [pool.submit(write, name) for name in ("Ann's", "Bob's")]
        ]

    # ! Exactly one, every time. Both is a lost update; neither would mean nobody can save.
    assert sorted(won) == [False, True]
