"""The assembled application: health, the envelope in situ, and the auth-seam boundary."""

import pytest
from fastapi.testclient import TestClient

from app.main import API_V1_PREFIX, create_app
from app.middleware.request_id import REQUEST_ID_HEADER


@pytest.fixture
def client(base_env: dict[str, str]) -> TestClient:
    return TestClient(create_app())


def test_healthz_is_liveness_only(client: TestClient) -> None:
    response = client.get("/healthz")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_every_response_carries_a_request_id(client: TestClient) -> None:
    assert REQUEST_ID_HEADER in client.get("/healthz").headers


def test_unknown_route_answers_the_error_envelope(client: TestClient) -> None:
    response = client.get("/does-not-exist")
    assert response.status_code == 404
    assert response.json()["error"]["code"] == "not_found"
    assert REQUEST_ID_HEADER in response.headers


def test_ops_routes_are_not_under_the_versioned_prefix(client: TestClient) -> None:
    # ! Features 004/005 add an auth dependency to the /api/v1 router. If /healthz ever moved under it, the probe would start needing a token — hence this boundary test.
    assert client.get(f"{API_V1_PREFIX}/healthz").status_code == 404


def test_openapi_is_exposed_in_development(client: TestClient) -> None:
    assert client.get("/openapi.json").status_code == 200


def test_openapi_is_hidden_outside_development(
    base_env: dict[str, str], monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setenv("APP_ENV", "production")
    production = TestClient(create_app())
    assert production.get("/openapi.json").status_code == 404
    assert production.get("/docs").status_code == 404
    # * Health still answers — it is not a development convenience.
    assert production.get("/healthz").status_code == 200
