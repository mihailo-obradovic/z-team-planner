"""Central configuration — the one entry point for environment access."""

from functools import lru_cache
from pathlib import Path
from typing import Literal

from pydantic import Field, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

Environment = Literal["development", "staging", "production"]

# * Both database URLs must spell the driver: a bare postgresql:// means psycopg2 on SQLAlchemy 2.0 and psycopg 3 on 2.1, so the driver would swap on a routine bump (operations.md, Neon Postgres → Quirks; decision 004).
_REQUIRED_DRIVER = "postgresql+psycopg://"


class Settings(BaseSettings):
    """Every environment variable the API reads, validated at startup."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_env: Environment = "development"
    service_name: str = "api"
    log_level: str = "INFO"

    # * The pooled Neon endpoint — the API's own traffic.
    database_url: str
    # ! The direct endpoint, migrations only. The pooled endpoint is PgBouncer in transaction mode, where session-level advisory locks fail *silently* — Alembic must never see it.
    database_url_direct: str

    # * Deny-by-default: an empty allowlist permits no browser origin at all.
    cors_allow_origins: list[str] = Field(default_factory=list)

    # * The edge request-size limit. Feature 005's 8 KB per-document cap is a business rule layered on top of this; the two do not conflict.
    max_request_bytes: int = 65536

    metrics_enabled: bool = False

    # * The Firebase project every accepted token must be minted for: firebase-admin checks the issuer and the audience against it, so a token from another project is refused (feature 004).
    firebase_project_id: str
    # * The service-account JSON firebase-admin authenticates with. Optional only when the emulator is in use, which the guard below already confines to development.
    firebase_service_account_file: Path | None = None

    # * Read by firebase-admin itself, straight from the environment. Nothing here passes it on; these two guards are the only code that looks at it.
    firebase_auth_emulator_host: str | None = None

    @field_validator("database_url", "database_url_direct")
    @classmethod
    def _driver_is_explicit(cls, value: str, /) -> str:
        if not value.startswith(_REQUIRED_DRIVER):
            msg = f"must start with {_REQUIRED_DRIVER!r} — spell the driver explicitly"
            raise ValueError(msg)
        return value

    @model_validator(mode="after")
    def _refuse_emulator_outside_development(self) -> Settings:
        # ! FIREBASE_AUTH_EMULATOR_HOST outside development is a total auth bypass: emulator tokens are unsigned, so anyone could mint one. The API refuses to start rather than serve with authentication effectively disabled (feature 004, Invariants; operations.md, Firebase → Quirks).
        if self.firebase_auth_emulator_host and self.app_env != "development":
            msg = (
                f"FIREBASE_AUTH_EMULATOR_HOST is set while APP_ENV is {self.app_env!r}. "
                "Emulator tokens are unsigned, so this would disable authentication "
                "entirely. Refusing to start."
            )
            raise ValueError(msg)
        return self

    @model_validator(mode="after")
    def _needs_credentials_unless_emulated(self) -> Settings:
        # * Without either, every request would fail at token verification instead of at startup — the same fail-fast reasoning as the database URLs (decision 005).
        if self.firebase_service_account_file is None:
            if not self.firebase_auth_emulator_host:
                msg = (
                    "FIREBASE_SERVICE_ACCOUNT_FILE is required unless "
                    "FIREBASE_AUTH_EMULATOR_HOST is set."
                )
                raise ValueError(msg)
        elif not self.firebase_service_account_file.is_file():
            msg = (
                "FIREBASE_SERVICE_ACCOUNT_FILE does not exist: "
                f"{self.firebase_service_account_file}"
            )
            raise ValueError(msg)
        return self


@lru_cache
def get_settings() -> Settings:
    """The process-wide settings, resolved once.

    Called eagerly by the app factory so a missing or malformed variable stops the
    process instead of surfacing as a 500 on the first request.
    """
    # * Every field is populated from the environment, which pyright cannot see.
    return Settings()  # pyright: ignore[reportCallIssue]
