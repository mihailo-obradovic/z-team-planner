"""Accept or generate the request id, and echo it on the way out."""

import re
from collections.abc import Awaitable, Callable
from uuid import uuid4

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

from app.core.logging import request_id_var

REQUEST_ID_HEADER = "X-Request-ID"

# * An inbound id is echoed into every log line, so it is sanitised first: an unvalidated header would let a caller inject newlines and forge log records.
_MAX_LENGTH = 128
_ALLOWED = re.compile(r"^[A-Za-z0-9._:-]+$")

Handler = Callable[[Request], Awaitable[Response]]


def _incoming_id(request: Request) -> str | None:
    candidate = request.headers.get(REQUEST_ID_HEADER)
    if not candidate:
        return None
    candidate = candidate[:_MAX_LENGTH]
    return candidate if _ALLOWED.match(candidate) else None


class RequestIdMiddleware(BaseHTTPMiddleware):
    """The edge of request tracing: one id per request, propagated and returned."""

    async def dispatch(self, request: Request, call_next: Handler) -> Response:
        request_id = _incoming_id(request) or uuid4().hex[:12]
        token = request_id_var.set(request_id)
        try:
            response = await call_next(request)
        finally:
            # * Reset even on failure, or the id bleeds into the next request on this task.
            request_id_var.reset(token)
        response.headers[REQUEST_ID_HEADER] = request_id
        return response
