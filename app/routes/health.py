"""Liveness and readiness.

Mounted at the root, deliberately outside `/api/v1`: features 004 and 005 add an auth
dependency to the versioned router, and ops endpoints must never sit on the user-traffic
auth seam (architecture.md, Observability).
"""

from fastapi import APIRouter

router = APIRouter(tags=["ops"])


@router.get("/healthz", summary="Liveness — the process is up")
def healthz() -> dict[str, str]:
    # * Liveness only: touches nothing. Readiness is /readyz, and the distinction is the point — a liveness probe that checks the database restarts the process when the database blinks.
    return {"status": "ok"}
