"""The explicit request-size limit at the edge (architecture.md, Security)."""

from collections.abc import Awaitable, Callable

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse, Response

from app.exceptions.errors import ErrorBody, ErrorCode, ErrorEnvelope

Handler = Callable[[Request], Awaitable[Response]]


class BodyLimitMiddleware(BaseHTTPMiddleware):
    """Refuse an oversized body before it is read.

    This is the transport-level ceiling. Feature 005's 8 KB per-document cap is a business
    rule that layers on top of it; the two limits do not conflict.
    """

    def __init__(self, app: object, *, max_bytes: int) -> None:
        super().__init__(app)  # pyright: ignore[reportArgumentType]
        self._max_bytes = max_bytes

    async def dispatch(self, request: Request, call_next: Handler) -> Response:
        declared = request.headers.get("content-length")
        if declared and declared.isdigit() and int(declared) > self._max_bytes:
            envelope = ErrorEnvelope(
                error=ErrorBody(
                    code=ErrorCode.PAYLOAD_TOO_LARGE,
                    message=f"Request body exceeds {self._max_bytes} bytes.",
                )
            )
            # * The request-id header is added on the way out by RequestIdMiddleware, which wraps this one.
            return JSONResponse(
                status_code=413,
                content=envelope.model_dump(mode="json", exclude_none=True),
            )
        return await call_next(request)
