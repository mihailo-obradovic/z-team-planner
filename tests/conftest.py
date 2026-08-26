"""Shared fixtures."""

import json
import logging
from collections.abc import Iterator
from pathlib import Path

import pytest

from app.core.config import Settings, get_settings

try:
    from testcontainers.postgres import PostgresContainer
except ImportError:  # pragma: no cover
    PostgresContainer = None  # pyright: ignore[reportAssignmentType]

_POOLED = "postgresql+psycopg://u:p@ep-x-pooler.eu-central-1.aws.neon.tech/neondb"
_DIRECT = "postgresql+psycopg://u:p@ep-x.eu-central-1.aws.neon.tech/neondb"
FIREBASE_PROJECT = "z-team-planner-test"


@pytest.fixture(scope="session")
def service_account_file(tmp_path_factory: pytest.TempPathFactory) -> Path:
    """A syntactically real service-account key, generated for this run.

    firebase-admin parses the private key the moment it builds a Certificate, so a stub file
    will not do — and a real key must never be committed. Generating one keeps the credential
    path under test without a secret in the repository (prime directive, Honest Inputs).
    """
    from cryptography.hazmat.primitives import serialization
    from cryptography.hazmat.primitives.asymmetric import rsa

    key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    path = tmp_path_factory.mktemp("firebase") / "service-account.json"
    path.write_text(
        json.dumps(
            {
                "type": "service_account",
                "project_id": FIREBASE_PROJECT,
                "private_key_id": "test-key",
                "private_key": key.private_bytes(
                    encoding=serialization.Encoding.PEM,
                    format=serialization.PrivateFormat.PKCS8,
                    encryption_algorithm=serialization.NoEncryption(),
                ).decode(),
                "client_email": f"test@{FIREBASE_PROJECT}.iam.gserviceaccount.com",
                "token_uri": "https://oauth2.googleapis.com/token",
            }
        )
    )

    return path


@pytest.fixture
def isolated_env(monkeypatch: pytest.MonkeyPatch) -> None:
    """Let `Settings` see only what the test sets — never the developer's own environment.

    ! pydantic-settings reads the repository's `.env` and the real process environment on
    ! every `Settings()`. Either can decide a test's outcome: following README's local
    ! sign-in instructions and setting `FIREBASE_AUTH_EMULATOR_HOST` is by itself enough to
    ! trip config.py's emulator guard before the assertion under test is ever reached.
    """
    # * Replacing model_config drops `env_file`, which is what closes the `.env` path.
    monkeypatch.setattr("app.core.config.Settings.model_config", {"extra": "ignore"})
    # * Derived from the model rather than listed, so a setting added later is covered too.
    for name in Settings.model_fields:
        monkeypatch.delenv(name.upper(), raising=False)


@pytest.fixture(autouse=True)
def _clear_settings_cache() -> Iterator[None]:
    # * get_settings is lru_cached, so without this a Settings built by one test leaks into every later one.
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()


@pytest.fixture
def base_env(
    monkeypatch: pytest.MonkeyPatch, service_account_file: Path, isolated_env: None
) -> dict[str, str]:
    """A minimal valid environment; tests mutate what they are about."""
    # * Credentials rather than the emulator host, so an app built here works under any APP_ENV — the emulator variable is refused outside development, and the tests about that guard set it themselves.
    env = {
        "DATABASE_URL": _POOLED,
        "DATABASE_URL_DIRECT": _DIRECT,
        "FIREBASE_PROJECT_ID": FIREBASE_PROJECT,
        "FIREBASE_SERVICE_ACCOUNT_FILE": str(service_account_file),
    }
    for key, value in env.items():
        monkeypatch.setenv(key, value)
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
def migrated_db(container_env: None) -> Iterator[None]:
    """A container database at head, emptied before each test that uses it."""
    from alembic import command
    from alembic.config import Config
    from sqlalchemy import create_engine, text

    from app.core.config import get_settings

    command.upgrade(Config("alembic.ini"), "head")
    engine = create_engine(get_settings().database_url_direct)
    try:
        with engine.begin() as connection:
            # * TRUNCATE ... CASCADE rather than dropping and re-migrating per test: it is far quicker, and CASCADE reaches whatever later features hang off users.
            connection.execute(text("TRUNCATE TABLE users CASCADE"))
        yield
    finally:
        engine.dispose()


@pytest.fixture
def container_env(
    postgres_container,
    monkeypatch: pytest.MonkeyPatch,
    service_account_file: Path,
    isolated_env: None,
) -> Iterator[None]:
    url = postgres_container.get_connection_url()
    monkeypatch.setenv("DATABASE_URL", url)
    monkeypatch.setenv("DATABASE_URL_DIRECT", url)
    monkeypatch.setenv("FIREBASE_PROJECT_ID", FIREBASE_PROJECT)
    monkeypatch.setenv("FIREBASE_SERVICE_ACCOUNT_FILE", str(service_account_file))
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()
