"""The application factory and its wiring order."""

import logging
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import APIRouter, FastAPI
from starlette.middleware.cors import CORSMiddleware

from app.core.config import Settings, get_settings
from app.core.database import build_engine, build_session_factory
from app.core.firebase import init_firebase
from app.core.logging import configure_logging
from app.exceptions import register_exception_handlers
from app.middleware import (
    BodyLimitMiddleware,
    RequestIdMiddleware,
    RequestLoggingMiddleware,
)
from app.middleware.metrics import MetricsMiddleware
from app.routes import builds, health, metrics, shared
from app.utils.ratelimit import TokenBucketLimiter

logger = logging.getLogger(__name__)

API_V1_PREFIX = "/api/v1"


def _register_middleware(app: FastAPI, settings: Settings) -> None:
    # ! Starlette applies these outermost-last, so the effective order is the reverse of the reading order: CORS -> RequestId -> RequestLogging -> BodyLimit.
    if settings.metrics_enabled:
        app.add_middleware(MetricsMiddleware)
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


@asynccontextmanager
async def _lifespan(app: FastAPI) -> AsyncIterator[None]:
    # * The engine is built once per application, not per request, and disposed on shutdown so a reload does not leak Neon connections.
    yield
    app.state.engine.dispose()


def create_app() -> FastAPI:
    """Build the application. Order below is load-bearing."""
    # * Eager, so a missing or malformed variable aborts import and uvicorn never binds.
    settings = get_settings()
    configure_logging(settings)
    # * Eager too: a missing or unreadable service-account key must stop the process, not surface as a 503 on the first signed-in request (decision 005, fail fast).
    init_firebase(settings)

    app = FastAPI(
        title="Z-Team Planner API",
        version="0.1.0",
        # * OpenAPI is a development convenience, not a public surface.
        docs_url="/docs" if settings.app_env == "development" else None,
        redoc_url=None,
        openapi_url="/openapi.json" if settings.app_env == "development" else None,
        lifespan=_lifespan,
    )

    # * Held on app.state so get_db can reach it through the request, and so a test can build an app against a different database without touching module globals.
    app.state.engine = build_engine(settings)
    app.state.session_factory = build_session_factory(app.state.engine)

    register_exception_handlers(app)
    _register_middleware(app, settings)

    # * Ops routes first and at the root — never under the versioned prefix the auth seam will guard.
    app.include_router(health.router)
    if settings.metrics_enabled:
        # * Not registered at all when disabled, so it 404s rather than existing-but-refusing — it is never routable in an environment that has not deliberately turned it on.
        app.include_router(metrics.router)

    # * Held on app.state, not module scope: a second application in the same process (every test builds one) must not inherit the first one's counts. 60 a minute per caller, feature 005's stopgap figure.
    app.state.shared_limiter = TokenBucketLimiter(capacity=60, refill_per_second=1.0)

    api_v1 = APIRouter(prefix=API_V1_PREFIX)
    api_v1.include_router(builds.router)
    api_v1.include_router(shared.router)
    # * Feature 004 adds me here.
    app.include_router(api_v1)

    logger.info("Application configured (env=%s)", settings.app_env)
    return app


# ! No module-level `app = create_app()`. That would make merely importing this module read the environment and reconfigure logging process-wide — an import side effect that leaks into anything that imports it, tests included. uvicorn calls the factory instead: `uvicorn app.main:create_app --factory`, which still fails fast, because a bad Settings aborts before the socket binds.
