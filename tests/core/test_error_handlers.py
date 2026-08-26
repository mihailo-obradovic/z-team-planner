"""The handlers, exercised over a throwaway app.

The routes here exist only inside these tests — the scaffold ships no product behavior.
"""

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from pydantic import BaseModel

from app.core.logging import request_id_var
from app.exceptions import AppError, ErrorCode, register_exception_handlers
from app.exceptions.handlers import REQUEST_ID_HEADER


class _Payload(BaseModel):
    name: str


@pytest.fixture
def client() -> TestClient:
    app = FastAPI()
    register_exception_handlers(app)

    @app.get("/boom")
    async def _boom() -> None:
        raise RuntimeError("internal detail that must not leak")

    @app.get("/known")
    async def _known() -> None:
        raise AppError(
            ErrorCode.BUILD_LIMIT, "You can keep up to 20 builds.", status_code=409
        )

    @app.post("/validated")
    async def _validated(payload: _Payload) -> dict[str, str]:
        return {"name": payload.name}

    # * raise_server_exceptions=False so the 500 is answered rather than re-raised into the test.
    return TestClient(app, raise_server_exceptions=False)


@pytest.fixture(autouse=True)
def _request_id():
    token = request_id_var.set("abc123def456")
    yield
    request_id_var.reset(token)


def test_app_error_maps_to_its_status_and_code(client: TestClient) -> None:
    response = client.get("/known")
    assert response.status_code == 409
    assert response.json() == {
        "error": {"code": "build_limit", "message": "You can keep up to 20 builds."}
    }
    # * details is absent, not null — it is a 422-only key.
    assert "details" not in response.json()["error"]


def test_unhandled_exception_leaks_nothing(client: TestClient) -> None:
    response = client.get("/boom")
    assert response.status_code == 500
    body = response.json()
    assert body == {
        "error": {"code": "internal_error", "message": "An unexpected error occurred."}
    }
    assert "internal detail" not in response.text


def test_five_hundred_still_carries_the_request_id(client: TestClient) -> None:
    # ! The regression test for ServerErrorMiddleware sitting outside the middleware stack: without the handler setting it, this header would be missing on exactly the responses that most need correlating.
    assert client.get("/boom").headers[REQUEST_ID_HEADER] == "abc123def456"


def test_unknown_route_answers_the_envelope(client: TestClient) -> None:
    response = client.get("/nope")
    assert response.status_code == 404
    assert response.json()["error"]["code"] == "not_found"


def test_validation_failure_carries_details_with_paths(client: TestClient) -> None:
    response = client.post("/validated", json={})
    assert response.status_code == 422
    error = response.json()["error"]
    assert error["code"] == "validation_failed"
    assert error["details"] == [{"path": "name", "message": "Field required"}]
