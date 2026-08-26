"""`/me` — the profile read, against a real database."""

from typing import Any
from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient
from firebase_admin import auth as firebase_auth
from sqlalchemy import select

from app.main import create_app
from app.models import User
from tests.routes.conftest import ME, Api

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
