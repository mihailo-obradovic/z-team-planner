"""Request metrics (architecture.md, Observability)."""

import time
from collections.abc import Awaitable, Callable

from prometheus_client import Counter, Histogram
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

Handler = Callable[[Request], Awaitable[Response]]

# * The rate, error rate and latency distribution the Universal Rule asks for at minimum.
REQUESTS = Counter(
    "http_requests_total",
    "HTTP requests by method, route template and status.",
    ["method", "path", "status"],
)
LATENCY = Histogram(
    "http_request_duration_seconds",
    "HTTP request duration by method and route template.",
    ["method", "path"],
)

_UNMATCHED = "<unmatched>"


def _route_template(request: Request) -> str:
    # ! The route *template* (/api/v1/builds/{id}), never request.url.path: the raw path carries build UUIDs, and metric labels must have bounded cardinality — ids are never labels.
    route = request.scope.get("route")
    path = getattr(route, "path", None)
    return path if isinstance(path, str) else _UNMATCHED


class MetricsMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: Handler) -> Response:
        started = time.perf_counter()
        response = await call_next(request)
        path = _route_template(request)
        LATENCY.labels(request.method, path).observe(time.perf_counter() - started)
        REQUESTS.labels(request.method, path, str(response.status_code)).inc()
        return response
