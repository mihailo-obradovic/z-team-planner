"""Alembic wiring. There are no revisions yet, so this proves env.py, not a schema."""

from pathlib import Path

import pytest
from alembic import command
from alembic.config import Config
from sqlalchemy import create_engine, inspect

REPO_ROOT = Path(__file__).resolve().parent.parent


def _alembic_config() -> Config:
    return Config(str(REPO_ROOT / "alembic.ini"))


@pytest.mark.integration
def test_upgrade_head_succeeds_with_zero_revisions(container_env: None) -> None:
    # * A no-op upgrade is still a real exercise of env.py: it resolves settings, builds the engine and opens a connection.
    command.upgrade(_alembic_config(), "head")


@pytest.mark.integration
def test_version_table_is_created(container_env: None) -> None:
    from app.core.config import get_settings

    command.upgrade(_alembic_config(), "head")
    engine = create_engine(get_settings().database_url_direct)
    try:
        assert "alembic_version" in inspect(engine).get_table_names()
    finally:
        engine.dispose()


@pytest.mark.integration
def test_env_uses_the_direct_url_not_the_pooled_one(
    container_env: None, monkeypatch: pytest.MonkeyPatch
) -> None:
    # ! The failure this guards is silent: Alembic against the PgBouncer pooled endpoint loses its advisory lock without an error. Point the pooled URL somewhere unusable — a run that touched it would fail.
    from app.core.config import get_settings

    monkeypatch.setenv("DATABASE_URL", "postgresql+psycopg://u:p@127.0.0.1:1/nope")
    get_settings.cache_clear()
    command.upgrade(_alembic_config(), "head")


def test_no_revisions_are_committed_yet() -> None:
    # * The first revision arrives with feature 004's users table; an empty baseline would be a no-op artifact someone later has to explain.
    versions = sorted(p.name for p in (REPO_ROOT / "alembic" / "versions").glob("*.py"))
    assert versions == []
