"""The Prometheus scrape endpoint.

Mounted at the root beside the health probes, so it is outside `/api/v1` and therefore
outside the auth seam features 004/005 add — metrics endpoints are never on the
user-traffic auth seam, and never publicly routable.
"""

from fastapi import APIRouter, Response
from prometheus_client import CONTENT_TYPE_LATEST, generate_latest

router = APIRouter(tags=["ops"])


@router.get("/metrics", summary="Prometheus metrics", include_in_schema=False)
def metrics() -> Response:
    # * Single-process only. Behind `uvicorn --workers N` each worker keeps its own registry and the numbers silently under-report; that needs PROMETHEUS_MULTIPROC_DIR and MultiProcessCollector.
    return Response(content=generate_latest(), media_type=CONTENT_TYPE_LATEST)
