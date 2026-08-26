"""`/me` — the profile read, against a real database."""

from typing import Any
from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient
from firebase_admin import auth as firebase_auth
from firebase_admin import exceptions as firebase_exceptions
from sqlalchemy import select

from app.main import API_V1_PREFIX, create_app
from app.models import User
from app.services import users as users_service
from tests.routes.conftest import ME, Api

SHARED = f"{API_V1_PREFIX}/shared"


def _accounts(api: Api) -> list[str]:
    """The `users` rows, read straight off the database.

    ! Never `api.me()`: the harness pins one identity, where the real dependency upserts on
    ! the way through and would answer a *fresh* row after a deletion (feature 004, Examples —
    ! "sign in after deleting the account"). Only the table says whether the row is gone.
    """
    factory = api.client.app.state.session_factory  # pyright: ignore[reportAttributeAccessIssue]
    with factory() as session:
        return [row.firebase_uid for row in session.execute(select(User)).scalars()]


pytestmark = pytest.mark.integration


def test_the_profile_carries_the_four_documented_fields(api: Api) -> None:
    response = api.me()

    assert response.status_code == 200
    body = response.json()
    assert set(body) == {"display_name", "email", "created_at", "build_count"}
    assert (body["display_name"], body["email"]) == ("Ann", "ann@example.com")
    assert body["created_at"].endswith("Z")
    assert body["build_count"] == 0


def test_the_profile_never_leaks_the_join_keys(api: Api) -> None:
    # ! firebase_uid and google_sub are how the two systems find each other; no client has a use for either, and the delete dialog certainly does not (feature 004, Outputs).
    body = api.me().json()

    assert "firebase_uid" not in body
    assert "google_sub" not in body


def test_the_build_count_follows_the_account_s_own_builds(api: Api) -> None:
    api.create("Main")
    api.create("Alt")

    assert api.me().json()["build_count"] == 2

    # * Another account's builds are another account's; the count is scoped by owner.
    api.act_as("bob")
    assert api.me().json()["build_count"] == 0


def test_a_deleted_build_stops_counting(api: Api) -> None:
    build_id = api.create("Main").json()["id"]
    api.create("Alt")

    api.delete(build_id)

    assert api.me().json()["build_count"] == 1


CLAIMS: dict[str, Any] = {
    "sub": "uid-new",
    "email": "new@example.com",
    "name": "New Player",
    "firebase": {"identities": {"google.com": ["google-new"]}},
}


def test_a_never_seen_account_is_created_by_its_first_request(
    migrated_db: None,
) -> None:
    """The full path: a real token, the real dependency, no override.

    `/me` is the first thing the client asks for after sign-in, so this is the request that
    has to create the row (feature 004, Examples).
    """
    app = create_app()

    with (
        TestClient(app) as client,
        patch.object(firebase_auth, "verify_id_token", return_value=CLAIMS),
    ):
        response = client.get(ME, headers={"Authorization": "Bearer x"})

    assert response.status_code == 200
    assert response.json()["display_name"] == "New Player"
    assert response.json()["build_count"] == 0

    with app.state.session_factory() as session:
        rows = list(session.execute(select(User)).scalars().all())

    assert [(row.firebase_uid, row.google_sub) for row in rows] == [
        ("uid-new", "google-new")
    ]


def test_deleting_the_account_takes_every_build_and_the_firebase_user(
    api: Api,
) -> None:
    build_id = api.create("Main").json()["id"]
    api.create("Alt")

    with patch.object(firebase_auth, "delete_user") as delete_user:
        response = api.delete_me()

    assert response.status_code == 204
    assert response.content == b""
    # * Total across both systems, in one request (feature 004, Invariants).
    delete_user.assert_called_once_with("uid-ann")
    assert _accounts(api) == ["uid-bob"]
    # ! The share link to a deleted build answers 404 from then on, not 403 — there is nothing left to be forbidden about.
    assert api.client.get(f"{SHARED}/{build_id}").status_code == 404


def test_another_account_is_untouched_by_the_deletion(api: Api) -> None:
    api.act_as("bob")
    bobs_build = api.create("Bob's").json()["id"]

    api.act_as("ann")
    api.create("Ann's")
    with patch.object(firebase_auth, "delete_user"):
        api.delete_me()

    api.act_as("bob")
    assert api.me().json()["build_count"] == 1
    assert api.client.get(f"{SHARED}/{bobs_build}").status_code == 200


def test_a_firebase_that_will_not_answer_deletes_nothing(api: Api) -> None:
    api.create("Main")

    with patch.object(
        firebase_auth,
        "delete_user",
        side_effect=firebase_exceptions.UnavailableError("down", ValueError("down")),
    ):
        response = api.delete_me()

    assert response.status_code == 503
    assert response.json()["error"]["code"] == "service_unavailable"
    # ! Nothing deleted: Firebase runs first precisely so a failure there is recoverable by retrying.
    assert sorted(_accounts(api)) == ["uid-ann", "uid-bob"]
    assert api.me().json()["build_count"] == 1


def test_an_identity_firebase_has_already_lost_still_deletes_the_row(api: Api) -> None:
    """A retried delete, or one finished by hand in the console.

    The account is gone on the Firebase side and our row is what is left, so this is the one
    case where the SDK raising is not a reason to stop.
    """
    api.create("Main")

    with patch.object(
        firebase_auth,
        "delete_user",
        side_effect=firebase_auth.UserNotFoundError("no such user"),
    ):
        response = api.delete_me()

    assert response.status_code == 204
    assert _accounts(api) == ["uid-bob"]


def test_firebase_is_deleted_before_the_row(api: Api) -> None:
    """The ordering itself, not just its outcome.

    Both orders pass every test above on a happy path; only this one fails if the row goes
    first, which is the arrangement that can strand an identity owning nothing.
    """
    order: list[str] = []
    real_delete_by_id = users_service.users_repo.delete_by_id

    with (
        patch.object(
            firebase_auth,
            "delete_user",
            side_effect=lambda _uid: order.append("firebase"),
        ),
        patch.object(
            users_service.users_repo,
            "delete_by_id",
            side_effect=lambda session, user_id: (
                order.append("row"),
                real_delete_by_id(session, user_id),
            )[1],
        ),
    ):
        assert api.delete_me().status_code == 204

    assert order == ["firebase", "row"]
