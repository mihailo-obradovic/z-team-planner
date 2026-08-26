"""The error envelope every API route answers with.

Shape and vocabulary come from feature 005 (Business Rules) and are implemented here, in
the scaffold, so features 004 and 005 add codes rather than inventing their own shape.
"""

from enum import StrEnum

from pydantic import BaseModel


class ErrorCode(StrEnum):
    """The documented codes. A route never invents one."""

    UNAUTHENTICATED = "unauthenticated"
    FORBIDDEN = "forbidden"
    NOT_FOUND = "not_found"
    VALIDATION_FAILED = "validation_failed"
    PRECONDITION_REQUIRED = "precondition_required"
    PRECONDITION_FAILED = "precondition_failed"
    BUILD_LIMIT = "build_limit"
    PAYLOAD_TOO_LARGE = "payload_too_large"
    RATE_LIMITED = "rate_limited"
    IDEMPOTENCY_CONFLICT = "idempotency_conflict"
    # * Not in feature 005's list: it says a 500 carries a request id and no detail, but says nothing about its code. An unlabelled 500 body is worse than a labelled one, so the envelope stays uniform.
    INTERNAL_ERROR = "internal_error"


class ErrorDetail(BaseModel):
    """One field-level failure. Present on 422 only."""

    path: str
    message: str


class ErrorBody(BaseModel):
    code: ErrorCode
    message: str
    details: list[ErrorDetail] | None = None


class ErrorEnvelope(BaseModel):
    """`{"error": {"code", "message", "details"?}}` — declared so OpenAPI documents it."""

    error: ErrorBody


class AppError(Exception):
    """A failure the API knows how to answer. Raised by services, mapped by the handlers."""

    def __init__(
        self,
        code: ErrorCode,
        message: str,
        *,
        status_code: int,
        details: list[ErrorDetail] | None = None,
    ) -> None:
        super().__init__(message)
        self.code = code
        self.message = message
        self.status_code = status_code
        self.details = details
