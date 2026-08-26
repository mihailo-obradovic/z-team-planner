"""The storage layer: the schema's own guarantees, and what the repositories do with them."""

from collections.abc import Iterator
from datetime import UTC, datetime, timedelta
from uuid import uuid4

import pytest
from sqlalchemy import Engine, create_engine, inspect, text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, sessionmaker

from app.models import User
from app.repositories import builds as builds_repo
from app.repositories import users as users_repo
from app.schemas.builds import BuildOut, render_timestamp

DOCUMENT = {"v": 1, "ec": "coupe", "lu": {"golem": [3, 3, 3, 0, 0]}}

pytestmark = pytest.mark.integration


@pytest.fixture
def engine(migrated_db: None) -> Iterator[Engine]:
    from app.core.config import get_settings

    engine = create_engine(get_settings().database_url_direct)
    try:
        yield engine
    finally:
        engine.dispose()


@pytest.fixture
def session(engine: Engine) -> Iterator[Session]:
    with sessionmaker(bind=engine, expire_on_commit=False)() as session:
        yield session


@pytest.fixture
def owner(session: Session) -> User:
    user = users_repo.upsert_by_firebase_uid(
        session,
        firebase_uid="uid-ann",
        google_sub="google-ann",
        email="ann@example.com",
        display_name="Ann",
    )
    session.commit()

    return user


@pytest.fixture
def other(session: Session) -> User:
    user = users_repo.upsert_by_firebase_uid(
        session,
        firebase_uid="uid-bob",
        google_sub="google-bob",
        email="bob@example.com",
        display_name="Bob",
    )
    session.commit()

    return user


def test_the_schema_carries_both_tables(engine: Engine) -> None:
    tables = inspect(engine).get_table_names()

    assert {"users", "builds", "idempotency_keys"} <= set(tables)


def test_format_version_is_generated_from_the_document(
    session: Session, owner: User
) -> None:
    build = builds_repo.insert(session, owner_id=owner.id, name="Main", data=DOCUMENT)

    assert build.format_version == 1


def test_format_version_cannot_be_written_by_hand(
    session: Session, owner: User
) -> None:
    # ! The whole point of a generated column: no statement can set it to something the document does not say.
    with pytest.raises(Exception, match="generated|GENERATED"):
        session.execute(
            text(
                "INSERT INTO builds (id, owner_id, name, data, format_version)"
                " VALUES (:id, :owner, 'X', '{\"v\": 1}'::jsonb, 99)"
            ),
            {"id": uuid4(), "owner": owner.id},
        )


def test_the_document_is_returned_exactly_as_stored(
    session: Session, owner: User
) -> None:
    # * The round-trip invariant, at the layer that could break it: no key added, none dropped, no value changed.
    build = builds_repo.insert(session, owner_id=owner.id, name="Main", data=DOCUMENT)
    session.commit()
    session.expire_all()

    stored = builds_repo.get_owned(session, owner.id, build.id)
    assert stored is not None
    assert stored.data == DOCUMENT


def test_a_duplicate_name_for_one_account_is_refused(
    session: Session, owner: User
) -> None:
    builds_repo.insert(session, owner_id=owner.id, name="Main", data={"v": 1})
    session.commit()

    with pytest.raises(IntegrityError):
        builds_repo.insert(session, owner_id=owner.id, name="Main", data={"v": 1})
        session.commit()


def test_two_accounts_may_each_have_the_same_name(
    session: Session, owner: User, other: User
) -> None:
    builds_repo.insert(session, owner_id=owner.id, name="Main", data={"v": 1})
    builds_repo.insert(session, owner_id=other.id, name="Main", data={"v": 1})
    session.commit()

    assert builds_repo.count_for_owner(session, owner.id) == 1
    assert builds_repo.count_for_owner(session, other.id) == 1


def test_a_name_longer_than_eighty_characters_fits(
    session: Session, owner: User
) -> None:
    # * A suffixed 80-character name is 84, which is why the column is 90 (feature 005, Edge Cases).
    suffixed = "x" * 80 + " (2)"
    build = builds_repo.insert(session, owner_id=owner.id, name=suffixed, data={"v": 1})
    session.commit()

    assert build.name == suffixed


def test_deleting_the_account_takes_its_builds_and_keys(
    session: Session, owner: User, other: User
) -> None:
    from app.repositories import idempotency as idempotency_repo

    builds_repo.insert(session, owner_id=owner.id, name="Main", data={"v": 1})
    builds_repo.insert(session, owner_id=other.id, name="Theirs", data={"v": 1})
    idempotency_repo.claim(session, owner_id=owner.id, key="k1", request_hash="h")
    session.commit()

    # * Feature 004's DELETE /me is not written yet; the cascade it relies on is the schema's, and this is that cascade.
    session.execute(text("DELETE FROM users WHERE id = :id"), {"id": owner.id})
    session.commit()

    assert builds_repo.count_for_owner(session, owner.id) == 0
    assert idempotency_repo.get(session, owner.id, "k1") is None
    # * The other account is untouched.
    assert builds_repo.count_for_owner(session, other.id) == 1


def test_a_list_is_newest_updated_first(session: Session, owner: User) -> None:
    for name in ("first", "second", "third"):
        builds_repo.insert(session, owner_id=owner.id, name=name, data={"v": 1})
        session.commit()

    builds = builds_repo.list_for_owner(session, owner.id, offset=0, limit=10)
    stamps = [build.updated_at for build in builds]

    assert stamps == sorted(stamps, reverse=True)
    assert len(builds) == 3


def test_a_page_is_a_window_on_that_order(session: Session, owner: User) -> None:
    for index in range(7):
        builds_repo.insert(
            session, owner_id=owner.id, name=f"build-{index}", data={"v": 1}
        )
        session.commit()

    everything = builds_repo.list_for_owner(session, owner.id, offset=0, limit=100)
    page_two = builds_repo.list_for_owner(session, owner.id, offset=5, limit=5)

    assert [build.id for build in page_two] == [build.id for build in everything[5:7]]


def test_another_account_s_build_reads_as_absent(
    session: Session, owner: User, other: User
) -> None:
    build = builds_repo.insert(session, owner_id=other.id, name="Theirs", data={"v": 1})
    session.commit()

    # ! Indistinguishable from an unknown id, which is what lets the route answer 404 rather than 403 and leak that the build exists.
    assert builds_repo.get_owned(session, owner.id, build.id) is None
    # * The public read has no owner check at all — the id is the capability.
    assert builds_repo.get_public(session, build.id) is not None


def test_a_guarded_update_needs_the_current_timestamp(
    session: Session, owner: User
) -> None:
    build = builds_repo.insert(session, owner_id=owner.id, name="Main", data={"v": 1})
    session.commit()
    held = build.updated_at

    updated = builds_repo.update_guarded(
        session,
        build_id=build.id,
        owner_id=owner.id,
        expected_updated_at=held,
        name="Renamed",
        data=DOCUMENT,
    )
    session.commit()

    assert updated is not None
    assert updated.name == "Renamed"
    assert updated.data == DOCUMENT
    # ! A new ETag every write, or a second writer holding the old one would still be let through.
    assert updated.updated_at > held


def test_a_guarded_update_with_a_stale_timestamp_changes_nothing(
    session: Session, owner: User
) -> None:
    build = builds_repo.insert(session, owner_id=owner.id, name="Main", data={"v": 1})
    session.commit()
    stale = build.updated_at - timedelta(seconds=1)

    assert (
        builds_repo.update_guarded(
            session,
            build_id=build.id,
            owner_id=owner.id,
            expected_updated_at=stale,
            name="Renamed",
            data=DOCUMENT,
        )
        is None
    )
    session.rollback()

    kept = builds_repo.get_owned(session, owner.id, build.id)
    assert kept is not None
    assert (kept.name, kept.data) == ("Main", {"v": 1})


def test_a_guarded_update_will_not_touch_another_account_s_build(
    session: Session, owner: User, other: User
) -> None:
    build = builds_repo.insert(session, owner_id=other.id, name="Theirs", data={"v": 1})
    session.commit()

    assert (
        builds_repo.update_guarded(
            session,
            build_id=build.id,
            owner_id=owner.id,
            expected_updated_at=build.updated_at,
            name="Stolen",
            data={"v": 1},
        )
        is None
    )


def test_delete_reports_whether_anything_went(
    session: Session, owner: User, other: User
) -> None:
    mine = builds_repo.insert(session, owner_id=owner.id, name="Mine", data={"v": 1})
    theirs = builds_repo.insert(
        session, owner_id=other.id, name="Theirs", data={"v": 1}
    )
    session.commit()

    assert builds_repo.delete_owned(session, owner.id, mine.id) is True
    assert builds_repo.delete_owned(session, owner.id, mine.id) is False
    assert builds_repo.delete_owned(session, owner.id, theirs.id) is False
    session.commit()

    assert builds_repo.count_for_owner(session, other.id) == 1


def test_names_for_owner_sees_only_that_account(
    session: Session, owner: User, other: User
) -> None:
    builds_repo.insert(session, owner_id=owner.id, name="Main", data={"v": 1})
    builds_repo.insert(session, owner_id=other.id, name="Theirs", data={"v": 1})
    session.commit()

    assert builds_repo.names_for_owner(session, owner.id) == {"Main"}


def test_the_etag_a_client_holds_reads_back_as_the_stored_timestamp(
    session: Session, owner: User
) -> None:
    # ! The whole If-Match chain in one assertion: what the body says, what the client returns, and what the guarded update compares must all be the same instant.
    build = builds_repo.insert(session, owner_id=owner.id, name="Main", data={"v": 1})
    session.commit()

    rendered = BuildOut.model_validate(build).model_dump(mode="json")["updated_at"]

    assert rendered == render_timestamp(build.updated_at)
    assert datetime.fromisoformat(rendered) == build.updated_at.astimezone(UTC)


def test_the_summary_carries_no_document(session: Session, owner: User) -> None:
    from app.schemas.builds import BuildSummaryOut

    build = builds_repo.insert(session, owner_id=owner.id, name="Main", data=DOCUMENT)
    session.commit()

    assert "data" not in BuildSummaryOut.model_validate(build).model_dump()


def test_the_public_shape_hides_the_owner(session: Session, owner: User) -> None:
    from app.schemas.builds import PublicBuildOut

    build = builds_repo.insert(session, owner_id=owner.id, name="Main", data=DOCUMENT)
    session.commit()

    assert set(PublicBuildOut.model_validate(build).model_dump()) == {
        "id",
        "name",
        "data",
        "updated_at",
    }
