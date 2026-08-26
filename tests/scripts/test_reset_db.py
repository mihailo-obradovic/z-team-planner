"""reset_db refuses far more often than it runs."""

from pathlib import Path

import pytest

from app.core.config import Settings, get_settings
from scripts.reset_db import RefusedError, guard, main
from tests.conftest import FIREBASE_PROJECT

_POOLED = "postgresql+psycopg://u:p@ep-x-pooler.eu-central-1.aws.neon.tech/neondb"
_DIRECT = "postgresql+psycopg://u:p@ep-x.eu-central-1.aws.neon.tech/neondb"


@pytest.fixture(autouse=True)
def _never_the_developers_env(isolated_env: None) -> None:
    """Every test here builds `Settings` directly, so none of them may see a real environment.

    ! `_settings()` is a plain function and cannot take a fixture, so the isolation is applied
    ! for the whole module instead. Without it these tests assert against whatever the
    ! developer's `.env` happens to hold, and the emulator host README asks for locally is
    ! enough to make config.py refuse before `guard()` is ever called.
    """


def _settings(service_account_file: Path, **overrides: str) -> Settings:
    values = {
        "database_url": _POOLED,
        "database_url_direct": _DIRECT,
        "firebase_project_id": FIREBASE_PROJECT,
        "firebase_service_account_file": service_account_file,
    } | overrides
    return Settings(**values)  # pyright: ignore[reportArgumentType]


def test_development_passes_the_guard(service_account_file: Path) -> None:
    guard(_settings(service_account_file, app_env="development"))


@pytest.mark.parametrize("app_env", ["staging", "production"])
def test_refuses_outside_development(service_account_file: Path, app_env: str) -> None:
    with pytest.raises(RefusedError, match="Refusing"):
        guard(_settings(service_account_file, app_env=app_env))


def test_refuses_a_pooled_direct_url(service_account_file: Path) -> None:
    # ! DDL through PgBouncer is the silent-failure path; refuse rather than half-drop.
    with pytest.raises(RefusedError, match="pooled endpoint"):
        guard(
            _settings(
                service_account_file,
                app_env="development",
                database_url_direct=_POOLED,
            )
        )


def test_does_nothing_without_yes(base_env: dict[str, str]) -> None:
    # * The safety that matters most: running it by reflex drops nothing.
    assert main([]) == 1


def test_production_exits_before_asking_about_yes(
    base_env: dict[str, str], monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setenv("APP_ENV", "production")
    get_settings.cache_clear()
    # * Exit 2, not 1: the environment guard runs before the confirmation flag, so --yes can never talk past it.
    assert main(["--yes"]) == 2
