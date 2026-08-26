"""The auth seam, against a real database.

Feature 005 needs the seam to produce an owner; feature 004 owns the rest of the token
contract and adds the full set of rejection cases with its `/me` routes.
"""

from typing import Any
from unittest.mock import patch

import pytest
from fastapi import APIRouter
from fastapi.testclient import TestClient
from firebase_admin import auth as firebase_auth
from sqlalchemy import select

from app.auth import CurrentUserDep
from app.main import API_V1_PREFIX, create_app
from app.models import User

WHOAMI = f"{API_V1_PREFIX}/whoami"

CLAIMS: dict[str, Any] = {
    "sub": "uid-ann",
    "email": "ann@example.com",
    "name": "Ann",
    "firebase": {"identities": {"google.com": ["google-ann"]}},
}


@pytest.fixture
def client(migrated_db: None) -> TestClient:
    """The assembled app plus a probe route that does nothing but name the seam."""
    app = create_app()
    probe = APIRouter()

    @probe.get("/whoami")
    def _whoami(user: CurrentUserDep) -> dict[str, str]:
        return {"uid": user.firebase_uid, "id": str(user.id)}

    app.include_router(probe, prefix=API_V1_PREFIX)

    return TestClient(app)


def _rows(client: TestClient) -> list[User]:
    factory = client.app.state.session_factory  # pyright: ignore[reportAttributeAccessIssue]
    with factory() as session:
        return list(session.execute(select(User)).scalars().all())


@pytest.mark.integration
def test_missing_header_is_a_challenge(client: TestClient) -> None:
    response = client.get(WHOAMI)

    assert response.status_code == 401
    assert response.headers["WWW-Authenticate"] == "Bearer"
    assert response.json()["error"]["code"] == "unauthenticated"
    assert "X-Request-ID" in response.headers


@pytest.mark.integration
@pytest.mark.parametrize(
    "header", ["Basic abc", "Bearer", "bearer", "Token abc", "abc"]
)
def test_a_header_that_is_not_a_bearer_token_is_refused(
    client: TestClient, header: str
) -> None:
    response = client.get(WHOAMI, headers={"Authorization": header})

    assert response.status_code == 401
    assert response.json()["error"]["code"] == "unauthenticated"


@pytest.mark.integration
@pytest.mark.parametrize("scheme", ["Bearer", "bearer", "BEARER"])
def test_the_scheme_is_case_insensitive(client: TestClient, scheme: str) -> None:
    # * RFC 7235 says the scheme is case-insensitive, and a client library is free to spell it any of these ways.
    with patch.object(firebase_auth, "verify_id_token", return_value=CLAIMS):
        response = client.get(WHOAMI, headers={"Authorization": f"{scheme} x"})

    assert response.status_code == 200


@pytest.mark.integration
@pytest.mark.parametrize(
    "failure",
    [
        firebase_auth.InvalidIdTokenError("bad signature"),
        firebase_auth.ExpiredIdTokenError("expired", cause=None),
        ValueError("not a string"),
    ],
)
def test_a_token_firebase_refuses_is_a_401(
    client: TestClient, failure: Exception
) -> None:
    # * Signature, expiry, issuer and audience are all firebase-admin's checks; what matters here is that each one becomes the documented 401 rather than a 500.
    with patch.object(firebase_auth, "verify_id_token", side_effect=failure):
        response = client.get(WHOAMI, headers={"Authorization": "Bearer x"})

    assert response.status_code == 401
    assert response.headers["WWW-Authenticate"] == "Bearer"
    assert _rows(client) == []


@pytest.mark.integration
def test_unfetchable_certificates_are_503_not_401(client: TestClient) -> None:
    # ! A Google outage must not read as "your session expired": a 401 would sign every user out, where a 503 keeps the session and asks them to retry (feature 004, "no outage-time data loss").
    with patch.object(
        firebase_auth,
        "verify_id_token",
        side_effect=firebase_auth.CertificateFetchError("offline", cause=None),
    ):
        response = client.get(WHOAMI, headers={"Authorization": "Bearer x"})

    assert response.status_code == 503
    assert response.json()["error"]["code"] == "service_unavailable"


@pytest.mark.integration
def test_a_valid_token_creates_the_account_once(client: TestClient) -> None:
    with patch.object(firebase_auth, "verify_id_token", return_value=CLAIMS):
        first = client.get(WHOAMI, headers={"Authorization": "Bearer x"})
        second = client.get(WHOAMI, headers={"Authorization": "Bearer x"})

    assert first.status_code == 200
    # * Same account across requests, so a build created on one request is owned by the same row on the next.
    assert first.json() == second.json()
    assert first.json()["uid"] == "uid-ann"

    rows = _rows(client)
    assert len(rows) == 1
    assert (rows[0].firebase_uid, rows[0].google_sub, rows[0].display_name) == (
        "uid-ann",
        "google-ann",
        "Ann",
    )


@pytest.mark.integration
def test_google_details_are_refreshed_but_the_subject_is_kept(
    client: TestClient,
) -> None:
    with patch.object(firebase_auth, "verify_id_token", return_value=CLAIMS):
        client.get(WHOAMI, headers={"Authorization": "Bearer x"})

    first_seen = _rows(client)[0].last_seen_at

    renamed = CLAIMS | {"email": "ann@newmail.com", "name": "Ann B"}
    # ! The identity claim is dropped from the second token on purpose: google_sub is captured at first sight and must survive a token that no longer carries it.
    renamed.pop("firebase")

    with patch.object(firebase_auth, "verify_id_token", return_value=renamed):
        client.get(WHOAMI, headers={"Authorization": "Bearer y"})

    rows = _rows(client)
    assert len(rows) == 1
    assert rows[0].email == "ann@newmail.com"
    assert rows[0].display_name == "Ann B"
    assert rows[0].google_sub == "google-ann"
    assert rows[0].last_seen_at > first_seen


@pytest.mark.integration
def test_a_nameless_google_account_falls_back_to_the_email_local_part(
    client: TestClient,
) -> None:
    nameless = {"sub": "uid-bob", "email": "bob.smith@example.com"}

    with patch.object(firebase_auth, "verify_id_token", return_value=nameless):
        assert (
            client.get(WHOAMI, headers={"Authorization": "Bearer x"}).status_code == 200
        )

    assert _rows(client)[0].display_name == "bob.smith"


@pytest.mark.integration
def test_two_accounts_stay_separate(client: TestClient) -> None:
    ann = {"sub": "uid-ann", "email": "ann@example.com", "name": "Ann"}
    bob = {"sub": "uid-bob", "email": "bob@example.com", "name": "Bob"}

    with patch.object(firebase_auth, "verify_id_token", return_value=ann):
        first = client.get(WHOAMI, headers={"Authorization": "Bearer a"}).json()
    with patch.object(firebase_auth, "verify_id_token", return_value=bob):
        second = client.get(WHOAMI, headers={"Authorization": "Bearer b"}).json()

    assert first["id"] != second["id"]
    assert len(_rows(client)) == 2
