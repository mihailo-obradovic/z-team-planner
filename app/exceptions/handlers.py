"""Central exception handlers — one place, one shape (architecture.md, Error Handling)."""

import logging

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.core.logging import request_id_var
from app.exceptions.errors import (
    AppError,
    ErrorBody,
    ErrorCode,
    ErrorDetail,
    ErrorEnvelope,
)

logger = logging.getLogger(__name__)

REQUEST_ID_HEADER = "X-Request-ID"

# * FastAPI's own status codes mapped onto the documented vocabulary, so a framework-raised 404 answers in the same shape a service-raised one does.
_STATUS_TO_CODE: dict[int, ErrorCode] = {
    401: ErrorCode.UNAUTHENTICATED,
    403: ErrorCode.FORBIDDEN,
    404: ErrorCode.NOT_FOUND,
    412: ErrorCode.PRECONDITION_FAILED,
    413: ErrorCode.PAYLOAD_TOO_LARGE,
    428: ErrorCode.PRECONDITION_REQUIRED,
    429: ErrorCode.RATE_LIMITED,
}


def _respond(
    status_code: int,
    code: ErrorCode,
    message: str,
    details: list[ErrorDetail] | None = None,
) -> JSONResponse:
    envelope = ErrorEnvelope(
        error=ErrorBody(code=code, message=message, details=details)
    )
    response = JSONResponse(
        status_code=status_code,
        content=envelope.model_dump(mode="json", exclude_none=True),
    )
    # ! Set here, not left to the middleware: a handler registered for Exception becomes ServerErrorMiddleware's, which sits *outside* the user middleware stack, so its response never passes through RequestIdMiddleware. Feature 005 requires the header on every response, 500s included.
    request_id = request_id_var.get()
    if request_id:
        response.headers[REQUEST_ID_HEADER] = request_id
    return response


def _location_to_path(location: tuple[int | str, ...]) -> str:
    """Turn Pydantic's `loc` into the dotted path feature 005's examples assert.

    `("body", "data", "lu", "coupe", "combat")` -> `data.lu.coupe.combat`
    `("body", "data", "fl", 0)`                 -> `data.fl[0]`
    """
    parts = list(location)
    # * Drop the transport segment: the client sent a document, not a "body".
    if parts and parts[0] in {"body", "query", "path", "header", "cookie"}:
        parts = parts[1:]
    if not parts:
        return "$"
    rendered = ""
    for part in parts:
        if isinstance(part, int):
            rendered += f"[{part}]"
        else:
            rendered = part if not rendered else f"{rendered}.{part}"
    return rendered


def register_exception_handlers(app: FastAPI) -> None:
    """Wire every failure path onto the one envelope."""

    @app.exception_handler(AppError)
    async def _app_error(_: Request, exc: AppError) -> JSONResponse:
        return _respond(exc.status_code, exc.code, exc.message, exc.details)

    @app.exception_handler(RequestValidationError)
    async def _validation_error(
        _: Request, exc: RequestValidationError
    ) -> JSONResponse:
        details = [
            ErrorDetail(path=_location_to_path(error["loc"]), message=error["msg"])
            for error in exc.errors()
        ]
        # * details is populated on 422 only — every other status omits the key entirely.
        return _respond(422, ErrorCode.VALIDATION_FAILED, "Validation failed.", details)

    @app.exception_handler(StarletteHTTPException)
    async def _http_error(_: Request, exc: StarletteHTTPException) -> JSONResponse:
        code = _STATUS_TO_CODE.get(exc.status_code, ErrorCode.INTERNAL_ERROR)
        return _respond(exc.status_code, code, str(exc.detail))

    @app.exception_handler(Exception)
    async def _unhandled(_: Request, exc: Exception) -> JSONResponse:
        logger.exception("Unhandled exception: %s", type(exc).__name__)
        # * No detail leaves the process: the request id in the header is how a report is correlated to the traceback in the log (feature 005, Error Handling).
        return _respond(500, ErrorCode.INTERNAL_ERROR, "An unexpected error occurred.")
