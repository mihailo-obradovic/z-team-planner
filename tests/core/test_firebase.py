"""Initialising firebase-admin — in particular against the Auth emulator."""

import os
from collections.abc import Iterator

import firebase_admin
import pytest
from firebase_admin import credentials
from google.auth import credentials as google_credentials

from app.core.config import Settings, get_settings
from app.core.firebase import init_firebase


@pytest.fixture
def no_default_app() -> Iterator[None]:
    """Start from a process with no default app, and leave it that way.

    ! firebase-admin's default app is process-global, so a test that initialises one would
    ! otherwise decide the outcome of every test after it.
    """
    try:
        firebase_admin.delete_app(firebase_admin.get_app())
    except ValueError:
        pass

    yield

    try:
        firebase_admin.delete_app(firebase_admin.get_app())
    except ValueError:
        pass


def _emulator_settings(monkeypatch: pytest.MonkeyPatch, isolated_env: None) -> Settings:
    monkeypatch.setenv("DATABASE_URL", "postgresql+psycopg://u:p@h/db")
    monkeypatch.setenv("DATABASE_URL_DIRECT", "postgresql+psycopg://u:p@h/db")
    monkeypatch.setenv("FIREBASE_PROJECT_ID", "z-team-planner")
    monkeypatch.setenv("FIREBASE_AUTH_EMULATOR_HOST", "localhost:9099")

    return get_settings()


def test_the_emulator_gets_a_credential_that_authenticates_nothing(
    monkeypatch: pytest.MonkeyPatch, isolated_env: None, no_default_app: None
) -> None:
    """Regression: signed-in local development answered 500 on every request.

    ! With no credential, firebase-admin falls back to Application Default Credentials — and
    ! it builds one eagerly the first time the auth client is used, emulator or not. A
    ! developer machine has no ADC, so `verify_id_token` raised `DefaultCredentialsError`
    ! and the central handler turned it into a 500 with no CORS header on it.
    """
    app = init_firebase(_emulator_settings(monkeypatch, isolated_env))

    assert not isinstance(app.credential, credentials.ApplicationDefault)
    assert isinstance(
        app.credential.get_credential(), google_credentials.AnonymousCredentials
    )


def test_a_service_account_key_is_used_when_there_is_one(
    monkeypatch: pytest.MonkeyPatch, base_env: dict[str, str], no_default_app: None
) -> None:
    app = init_firebase(get_settings())

    assert isinstance(app.credential, credentials.Certificate)


def test_a_second_call_reuses_the_process_wide_app(
    monkeypatch: pytest.MonkeyPatch, base_env: dict[str, str], no_default_app: None
) -> None:
    # * A test builds several applications in one process, and initialize_app raises on a second call.
    assert init_firebase(get_settings()) is init_firebase(get_settings())


def test_the_emulator_host_reaches_the_sdk_from_a_dotenv_file(
    monkeypatch: pytest.MonkeyPatch, isolated_env: None, no_default_app: None
) -> None:
    """Regression: the SDK refused every emulator token with "no kid claim".

    ! firebase-admin reads FIREBASE_AUTH_EMULATOR_HOST from os.environ, and pydantic-settings
    ! reads `.env` into a Settings object without exporting anything — so following README's
    ! `.env` instructions gave the SDK no idea the emulator existed, and it demanded a signed
    ! token. Settings is where the value arrives; this is where it has to leave.
    """
    settings = _emulator_settings(monkeypatch, isolated_env)
    monkeypatch.delenv("FIREBASE_AUTH_EMULATOR_HOST", raising=False)

    init_firebase(settings)

    assert os.environ["FIREBASE_AUTH_EMULATOR_HOST"] == "localhost:9099"
