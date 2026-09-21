"""Settings: startup validation, the driver check, and the emulator guard."""

import pytest
from pydantic import ValidationError

from app.core.config import (
    MigrationSettings,
    Settings,
    get_migration_settings,
    get_settings,
)


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


def test_service_account_json_replaces_the_file(
    base_env: dict[str, str], monkeypatch: pytest.MonkeyPatch
) -> None:
    # * Decision 007: a deployed host carries the key as environment contents, not a path.
    monkeypatch.delenv("FIREBASE_SERVICE_ACCOUNT_FILE")
    monkeypatch.setenv(
        "FIREBASE_SERVICE_ACCOUNT_JSON",
        '{"type": "service_account", "project_id": "z-team-planner"}',
    )
    settings = Settings()  # pyright: ignore[reportCallIssue]
    assert settings.firebase_service_account_file is None
    assert settings.firebase_service_account_json == {
        "type": "service_account",
        "project_id": "z-team-planner",
    }


def test_both_credential_spellings_refuse_to_start(
    base_env: dict[str, str], monkeypatch: pytest.MonkeyPatch
) -> None:
    # ! Two spellings of one credential is two ways to disagree about which key is live.
    monkeypatch.setenv("FIREBASE_SERVICE_ACCOUNT_JSON", '{"type": "service_account"}')
    with pytest.raises(ValidationError, match="mutually exclusive"):
        Settings()  # pyright: ignore[reportCallIssue]


def test_no_credential_at_all_refuses_to_start(
    base_env: dict[str, str], monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.delenv("FIREBASE_SERVICE_ACCOUNT_FILE")
    with pytest.raises(ValidationError, match="required unless"):
        Settings()  # pyright: ignore[reportCallIssue]


def test_migration_settings_need_only_the_direct_url(
    base_env: dict[str, str], monkeypatch: pytest.MonkeyPatch
) -> None:
    # * A schema change touches the database and nothing else. Requiring the Firebase credential here is how a private key ends up in a job that authenticates nobody.
    for name in (
        "DATABASE_URL",
        "FIREBASE_PROJECT_ID",
        "FIREBASE_SERVICE_ACCOUNT_FILE",
    ):
        monkeypatch.delenv(name)
    assert (
        get_migration_settings().database_url_direct == base_env["DATABASE_URL_DIRECT"]
    )


def test_migration_settings_refuse_a_bare_postgresql_url(
    base_env: dict[str, str], monkeypatch: pytest.MonkeyPatch
) -> None:
    # * The driver check is the reason migrations read through config.py at all rather than off os.environ: a bare URL swaps driver at the SQLAlchemy 2.1 bump.
    monkeypatch.setenv("DATABASE_URL_DIRECT", "postgresql://u:p@host/neondb")
    with pytest.raises(ValidationError, match="spell the driver explicitly"):
        MigrationSettings()  # pyright: ignore[reportCallIssue]
