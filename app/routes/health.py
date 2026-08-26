"""Liveness and readiness.

Mounted at the root, deliberately outside `/api/v1`: features 004 and 005 add an auth
dependency to the versioned router, and ops endpoints must never sit on the user-traffic
auth seam (architecture.md, Observability).
"""

import logging

from fastapi import APIRouter
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from app.core.database import DbSession

logger = logging.getLogger(__name__)

router = APIRouter(tags=["ops"])


@router.get("/healthz", summary="Liveness — the process is up")
def healthz() -> dict[str, str]:
    # * Liveness only: touches nothing. The distinction from /readyz is the point — a liveness probe that checks the database restarts the process every time the database blinks.
    return {"status": "ok"}


@router.get("/readyz", summary="Readiness — the API can serve")
def readyz(session: DbSession) -> JSONResponse:
    """Readiness fails only when the API cannot perform its core function.

    The database is that core function, so a database failure is a genuine readiness
    failure, not the "temporarily degraded optional dependency" the rule exempts.
    """
    try:
        session.execute(text("SELECT 1"))
    except SQLAlchemyError:
        # * Logged at warning, not error: a suspended Neon compute waking up is expected on the free plan, not a fault.
        logger.warning("Readiness check failed: database unavailable", exc_info=True)
        # * Deliberately not the error envelope: this is an ops endpoint outside the /api/v1 contract, its consumer is a load balancer, and feature 005's code vocabulary has no entry for it.
        return JSONResponse(
            status_code=503, content={"status": "not_ready", "database": "unavailable"}
        )
    return JSONResponse(status_code=200, content={"status": "ready", "database": "ok"})
