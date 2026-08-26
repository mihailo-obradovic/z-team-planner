"""Settings: startup validation, the driver check, and the emulator guard."""

import pytest
from pydantic import ValidationError

from app.core.config import Settings, get_settings


def test_valid_environment_builds(base_env: dict[str, str]) -> None:
    settings = get_settings()
    assert settings.app_env == "development"
    assert settings.service_name == "api"
    # * Deny-by-default: no origin is allowed until one is configured.
    assert settings.cors_allow_origins == []
    assert settings.metrics_enabled is False


def test_missing_database_url_stops_the_process(
    base_env: dict[str, str], monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.delenv("DATABASE_URL")
    with pytest.raises(ValidationError):
        Settings()  # pyright: ignore[reportCallIssue]


@pytest.mark.parametrize("field", ["DATABASE_URL", "DATABASE_URL_DIRECT"])
def test_bare_postgresql_url_is_refused(
    base_env: dict[str, str], monkeypatch: pytest.MonkeyPatch, field: str
) -> None:
    # * A bare postgresql:// silently swaps driver at the SQLAlchemy 2.1 bump.
    monkeypatch.setenv(field, "postgresql://u:p@host/neondb")
    with pytest.raises(ValidationError, match="spell the driver explicitly"):
        Settings()  # pyright: ignore[reportCallIssue]


@pytest.mark.parametrize("app_env", ["staging", "production"])
def test_emulator_host_outside_development_refuses_to_start(
    base_env: dict[str, str], monkeypatch: pytest.MonkeyPatch, app_env: str
) -> None:
    # * Feature 004, Examples: "FIREBASE_AUTH_EMULATOR_HOST set, APP_ENV=production → API refuses to start".
    monkeypatch.setenv("APP_ENV", app_env)
    monkeypatch.setenv("FIREBASE_AUTH_EMULATOR_HOST", "localhost:9099")
    with pytest.raises(ValidationError, match="Refusing to start"):
        Settings()  # pyright: ignore[reportCallIssue]


def test_emulator_host_is_allowed_in_development(
    base_env: dict[str, str], monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setenv("APP_ENV", "development")
    monkeypatch.setenv("FIREBASE_AUTH_EMULATOR_HOST", "localhost:9099")
    assert Settings().firebase_auth_emulator_host == "localhost:9099"  # pyright: ignore[reportCallIssue]


def test_settings_are_cached(base_env: dict[str, str]) -> None:
    assert get_settings() is get_settings()
