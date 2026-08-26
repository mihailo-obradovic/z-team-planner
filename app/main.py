"""The application factory and its wiring order."""

import logging

from fastapi import APIRouter, FastAPI
from starlette.middleware.cors import CORSMiddleware

from app.core.config import Settings, get_settings
from app.core.logging import configure_logging
from app.exceptions import register_exception_handlers
from app.middleware import (
    BodyLimitMiddleware,
    RequestIdMiddleware,
    RequestLoggingMiddleware,
)
from app.routes import health

logger = logging.getLogger(__name__)

API_V1_PREFIX = "/api/v1"


def _register_middleware(app: FastAPI, settings: Settings) -> None:
    # ! Starlette applies these outermost-last, so the effective order is the reverse of the reading order: CORS -> RequestId -> RequestLogging -> BodyLimit.
    app.add_middleware(BodyLimitMiddleware, max_bytes=settings.max_request_bytes)
    app.add_middleware(RequestLoggingMiddleware)
    app.add_middleware(RequestIdMiddleware)
    app.add_middleware(
        CORSMiddleware,
        # * Deny-by-default: an empty allowlist admits no origin at all.
        allow_origins=settings.cors_allow_origins,
        allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=[
            "Authorization",
            "Content-Type",
            "If-Match",
            "Idempotency-Key",
            "X-Request-ID",
        ],
        # * The browser cannot read a response header unless it is exposed; features 005 and 006 depend on both of these.
        expose_headers=["X-Request-ID", "ETag"],
        # ! No credentials: the API is bearer-token only and never sets a cookie (feature 004, Business Rules).
        allow_credentials=False,
    )


def create_app() -> FastAPI:
    """Build the application. Order below is load-bearing."""
    # * Eager, so a missing or malformed variable aborts import and uvicorn never binds.
    settings = get_settings()
    configure_logging(settings)

    app = FastAPI(
        title="Z-Team Planner API",
        version="0.1.0",
        # * OpenAPI is a development convenience, not a public surface.
        docs_url="/docs" if settings.app_env == "development" else None,
        redoc_url=None,
        openapi_url="/openapi.json" if settings.app_env == "development" else None,
    )

    register_exception_handlers(app)
    _register_middleware(app, settings)

    # * Ops routes first and at the root — never under the versioned prefix the auth seam will guard.
    app.include_router(health.router)

    api_v1 = APIRouter(prefix=API_V1_PREFIX)
    # * Feature routers mount here: 004 adds me, 005 adds builds and shared.
    app.include_router(api_v1)

    logger.info("Application configured (env=%s)", settings.app_env)
    return app


# ! No module-level `app = create_app()`. That would make merely importing this module read the environment and reconfigure logging process-wide — an import side effect that leaks into anything that imports it, tests included. uvicorn calls the factory instead: `uvicorn app.main:create_app --factory`, which still fails fast, because a bad Settings aborts before the socket binds.
