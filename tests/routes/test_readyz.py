"""Readiness against a real PostgreSQL, and against one that is gone."""

import pytest
from fastapi.testclient import TestClient

from app.main import create_app


@pytest.mark.integration
def test_ready_when_the_database_answers(container_env: None) -> None:
    with TestClient(create_app()) as client:
        response = client.get("/readyz")
    assert response.status_code == 200
    assert response.json() == {"status": "ready", "database": "ok"}


@pytest.mark.integration
def test_not_ready_when_the_database_is_unreachable(
    container_env: None, monkeypatch: pytest.MonkeyPatch
) -> None:
    # * Point the app at a port nothing listens on — the realistic shape of a suspended Neon compute that will not wake.
    monkeypatch.setenv(
        "DATABASE_URL",
        "postgresql+psycopg://u:p@127.0.0.1:1/neondb?connect_timeout=1",
    )
    from app.core.config import get_settings

    get_settings.cache_clear()
    with TestClient(create_app()) as client:
        response = client.get("/readyz")
    assert response.status_code == 503
    assert response.json() == {"status": "not_ready", "database": "unavailable"}


@pytest.mark.integration
def test_liveness_still_answers_when_the_database_is_down(
    container_env: None, monkeypatch: pytest.MonkeyPatch
) -> None:
    # ! The whole reason /healthz and /readyz are separate: a liveness probe that checked the database would restart the process every time Neon suspended.
    monkeypatch.setenv(
        "DATABASE_URL",
        "postgresql+psycopg://u:p@127.0.0.1:1/neondb?connect_timeout=1",
    )
    from app.core.config import get_settings

    get_settings.cache_clear()
    with TestClient(create_app()) as client:
        assert client.get("/healthz").status_code == 200
