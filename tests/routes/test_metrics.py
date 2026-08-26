"""The metrics endpoint: off by default, and label cardinality when on."""

import pytest
from fastapi.testclient import TestClient

from app.main import create_app
from app.middleware.metrics import _route_template


@pytest.fixture
def metrics_client(
    base_env: dict[str, str], monkeypatch: pytest.MonkeyPatch
) -> TestClient:
    monkeypatch.setenv("METRICS_ENABLED", "true")
    from app.core.config import get_settings

    get_settings.cache_clear()
    return TestClient(create_app())


def test_disabled_by_default(base_env: dict[str, str]) -> None:
    # * Not registered at all when off, so it 404s rather than existing-but-refusing.
    assert TestClient(create_app()).get("/metrics").status_code == 404


def test_serves_the_prometheus_exposition_format(metrics_client: TestClient) -> None:
    metrics_client.get("/healthz")
    response = metrics_client.get("/metrics")
    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/plain")
    assert "http_requests_total" in response.text
    assert "http_request_duration_seconds" in response.text


def test_counts_the_request_it_saw(metrics_client: TestClient) -> None:
    metrics_client.get("/healthz")
    body = metrics_client.get("/metrics").text
    assert 'http_requests_total{method="GET",path="/healthz",status="200"}' in body


def test_unmatched_routes_share_one_label(metrics_client: TestClient) -> None:
    # ! Cardinality guard: 404s on random URLs must not mint a label each, or a crawler would blow up the metric.
    for path in ("/nope-one", "/nope-two", "/nope-three"):
        metrics_client.get(path)
    body = metrics_client.get("/metrics").text
    assert "<unmatched>" in body
    assert "nope-one" not in body


def test_route_template_is_used_not_the_raw_path() -> None:
    # ! The label must be /api/v1/builds/{id}, never the path carrying a real UUID — ids are never metric labels (architecture.md, Observability).
    class _Route:
        path = "/api/v1/builds/{id}"

    class _Request:
        scope = {"route": _Route()}

    assert _route_template(_Request()) == "/api/v1/builds/{id}"  # pyright: ignore[reportArgumentType]


def test_metrics_is_not_under_the_versioned_prefix(metrics_client: TestClient) -> None:
    assert metrics_client.get("/api/v1/metrics").status_code == 404
