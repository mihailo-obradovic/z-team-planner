"""Two writers at once — the cases a single-threaded test cannot reach.

The naming search and the cap both read the account's builds and then insert. Between those
two steps another request can do the same thing, so what protects them is a row lock on the
account plus a unique constraint underneath. Both are asserted here by really racing.
"""

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
