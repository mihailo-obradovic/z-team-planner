"""The engine, the session factory, and the only way a request gets a session."""

from collections.abc import Iterator
from typing import Annotated

from fastapi import Depends
from sqlalchemy import Engine, create_engine
from sqlalchemy.orm import Session, sessionmaker
from starlette.requests import Request

from app.core.config import Settings

# * Neon free-plan computes suspend after 5 minutes idle and this cannot be disabled. A pooled connection held across the suspend fails with "SSL SYSCALL error: EOF detected", so the engine pre-pings and recycles below the boundary (operations.md, Neon Postgres → Quirks).
_POOL_PRE_PING = True
# ! 240 seconds, not 300: recycling exactly at the 5-minute mark races the suspend boundary.
_POOL_RECYCLE_SECONDS = 240
_CONNECT_TIMEOUT_SECONDS = 10


def build_engine(settings: Settings) -> Engine:
    """The application engine — always the pooled endpoint (decision 004)."""
    return create_engine(
        settings.database_url,
        pool_pre_ping=_POOL_PRE_PING,
        pool_recycle=_POOL_RECYCLE_SECONDS,
        connect_args={"connect_timeout": _CONNECT_TIMEOUT_SECONDS},
        echo=False,
    )


def build_session_factory(engine: Engine) -> sessionmaker[Session]:
    return sessionmaker(
        bind=engine,
        autoflush=False,
        autocommit=False,
        # * So an ORM object stays readable after its session closes — otherwise every response serialiser would re-query.
        expire_on_commit=False,
    )


def get_db(request: Request) -> Iterator[Session]:
    """The only way a request gets a session (the stack module's `get_db` dependency).

    It deliberately does **not** commit: transaction boundaries live in the service layer
    (architecture.md, Persistence). The FastAPI tutorial's version commits here — do not
    "restore" that.
    """
    session_factory: sessionmaker[Session] = request.app.state.session_factory
    session = session_factory()
    try:
        yield session
    finally:
        session.close()


# * The one spelling for "this route needs a session". Annotated rather than a Depends() default, which bugbear's B008 flags and which FastAPI itself now discourages.
DbSession = Annotated[Session, Depends(get_db)]
