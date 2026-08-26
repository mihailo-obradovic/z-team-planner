"""Shared fixtures."""

import logging
from collections.abc import Iterator

import pytest

from app.core.config import get_settings

try:
    from testcontainers.postgres import PostgresContainer
except ImportError:  # pragma: no cover
    PostgresContainer = None  # pyright: ignore[reportAssignmentType]

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


@pytest.fixture(autouse=True)
def _restore_logging() -> Iterator[None]:
    # ! configure_logging() runs dictConfig, which replaces the root handlers process-wide. Any test that builds the app would otherwise strip pytest's caplog handler for every test after it, so the configuration is snapshotted and put back.
    root = logging.getLogger()
    saved_handlers = root.handlers[:]
    saved_level = root.level
    saved_children = {
        name: (logger.handlers[:], logger.level, logger.propagate)
        for name, logger in logging.root.manager.loggerDict.items()
        if isinstance(logger, logging.Logger)
    }
    yield
    root.handlers[:] = saved_handlers
    root.setLevel(saved_level)
    for name, (handlers, level, propagate) in saved_children.items():
        logger = logging.getLogger(name)
        logger.handlers[:] = handlers
        logger.setLevel(level)
        logger.propagate = propagate


def _docker_is_available() -> bool:
    import subprocess

    try:
        return (
            subprocess.run(
                ["docker", "info"], capture_output=True, timeout=15
            ).returncode
            == 0
        )
    except OSError, subprocess.SubprocessError:
        return False


@pytest.fixture(scope="session")
def postgres_container():
    """A real PostgreSQL, per the persistence module — never a SQLite stand-in."""
    if PostgresContainer is None or not _docker_is_available():
        # ! A skip, never a lookalike substitute: integration tests run against the same engine as production (architecture.md, Testing). CI has Docker, so this never skips there.
        pytest.skip("Docker unavailable — integration tests require a daemon")
    with PostgresContainer("postgres:17-alpine", driver="psycopg") as container:
        yield container


@pytest.fixture
def container_env(
    postgres_container, monkeypatch: pytest.MonkeyPatch
) -> Iterator[None]:
    url = postgres_container.get_connection_url()
    monkeypatch.setenv("DATABASE_URL", url)
    monkeypatch.setenv("DATABASE_URL_DIRECT", url)
    monkeypatch.setattr("app.core.config.Settings.model_config", {"extra": "ignore"})
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()
