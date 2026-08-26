"""Shared fixtures."""

from collections.abc import Iterator

import pytest

from app.core.config import get_settings

_POOLED = "postgresql+psycopg://u:p@ep-x-pooler.eu-central-1.aws.neon.tech/neondb"
_DIRECT = "postgresql+psycopg://u:p@ep-x.eu-central-1.aws.neon.tech/neondb"


@pytest.fixture(autouse=True)
def _clear_settings_cache() -> Iterator[None]:
    # * get_settings is lru_cached, so without this a Settings built by one test leaks into every later one.
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()


@pytest.fixture
def base_env(monkeypatch: pytest.MonkeyPatch) -> dict[str, str]:
    """A minimal valid environment; tests mutate what they are about."""
    env = {"DATABASE_URL": _POOLED, "DATABASE_URL_DIRECT": _DIRECT}
    for key, value in env.items():
        monkeypatch.setenv(key, value)
    # * The repo's own .env must not leak into tests — a developer's real values would make these pass or fail for the wrong reason.
    monkeypatch.setattr("app.core.config.Settings.model_config", {"extra": "ignore"})
    return env
