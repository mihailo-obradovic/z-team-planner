"""Request id, the access line, and the body limit — over a throwaway app."""

import logging

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from starlette.middleware.cors import CORSMiddleware

from app.core.logging import request_id_var
from app.middleware import (
    BodyLimitMiddleware,
    RequestIdMiddleware,
    RequestLoggingMiddleware,
)
from app.middleware.request_id import REQUEST_ID_HEADER

_MAX_BYTES = 64

# * Every one of these is sent verbatim by httpx, so each really reaches the sanitiser.
HOSTILE_IDS = [
    "bad" + chr(10) + "id",
    "bad" + chr(13) + "id",
    "a b",
    "id;rm -rf",
    " ",
]


@pytest.fixture
def client() -> TestClient:
    app = FastAPI()

    @app.get("/ok")
    async def _ok() -> dict[str, str | None]:
        # * Proves the contextvar is readable inside the handler, not only in middleware.
        return {"seen": request_id_var.get()}

    @app.post("/echo")
    async def _echo(payload: dict[str, str]) -> dict[str, str]:
        return payload

    app.add_middleware(BodyLimitMiddleware, max_bytes=_MAX_BYTES)
    app.add_middleware(RequestLoggingMiddleware)
    app.add_middleware(RequestIdMiddleware)
    app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:3000"])
    return TestClient(app)


def test_generates_an_id_when_none_is_sent(client: TestClient) -> None:
    response = client.get("/ok")
    generated = response.headers[REQUEST_ID_HEADER]
    assert len(generated) == 12
    assert response.json()["seen"] == generated


def test_echoes_a_supplied_id(client: TestClient) -> None:
    response = client.get("/ok", headers={REQUEST_ID_HEADER: "trace-42"})
    assert response.headers[REQUEST_ID_HEADER] == "trace-42"
    assert response.json()["seen"] == "trace-42"


@pytest.mark.parametrize("hostile", HOSTILE_IDS)
def test_rejects_a_hostile_id_and_generates_instead(
    client: TestClient, hostile: str
) -> None:
    # ! An inbound id is echoed into log lines; a newline would let a caller forge records.
    response = client.get("/ok", headers={REQUEST_ID_HEADER: hostile})
    assert response.headers[REQUEST_ID_HEADER] != hostile
    assert len(response.headers[REQUEST_ID_HEADER]) == 12
    assert response.json()["seen"] == response.headers[REQUEST_ID_HEADER]


def test_truncates_an_overlong_id(client: TestClient) -> None:
    response = client.get("/ok", headers={REQUEST_ID_HEADER: "x" * 400})
    assert len(response.headers[REQUEST_ID_HEADER]) == 128


def test_context_does_not_leak_between_requests(client: TestClient) -> None:
    first = client.get("/ok", headers={REQUEST_ID_HEADER: "first"}).json()["seen"]
    second = client.get("/ok", headers={REQUEST_ID_HEADER: "second"}).json()["seen"]
    assert (first, second) == ("first", "second")
    assert request_id_var.get() is None


def test_oversized_body_is_refused_with_the_envelope(client: TestClient) -> None:
    response = client.post("/echo", json={"a": "x" * (_MAX_BYTES * 2)})
    assert response.status_code == 413
    assert response.json()["error"]["code"] == "payload_too_large"
    # * Still carries the id: RequestIdMiddleware wraps the body limit.
    assert REQUEST_ID_HEADER in response.headers


def test_body_within_the_limit_passes(client: TestClient) -> None:
    assert client.post("/echo", json={"a": "b"}).status_code == 200


def test_access_line_omits_body_and_headers(
    client: TestClient, caplog: pytest.LogCaptureFixture
) -> None:
    with caplog.at_level(logging.INFO, logger="app.middleware.logging"):
        client.post("/echo", json={"secret": "do-not-log-me"})
    line = caplog.records[-1].getMessage()
    assert line.startswith("POST /echo 200 ")
    assert "do-not-log-me" not in line


def test_cors_headers_reach_the_browser(client: TestClient) -> None:
    response = client.get("/ok", headers={"Origin": "http://localhost:3000"})
    assert response.headers["access-control-allow-origin"] == "http://localhost:3000"
