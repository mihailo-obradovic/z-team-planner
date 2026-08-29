"""The auth seam: authentication in one place, never repeated per route.

Every user-scoped route names `CurrentUserDep` and gets an owner id or a 401 — no route
inspects a header itself (architecture.md, Security).
"""

import logging
from typing import Annotated, Any

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from firebase_admin import auth as firebase_auth

from app.auth.schemas import CurrentUser, TokenClaims
from app.core.database import DbSession
from app.exceptions.errors import AppError, ErrorCode
from app.services.users import resolve_current_user

logger = logging.getLogger(__name__)

# * auto_error=False so a missing header reaches our handler and answers the documented envelope; FastAPI's own would be a bare 403 in a shape no client parses.
_bearer = HTTPBearer(auto_error=False)

# * A 401 without this header is a refusal, not a challenge (feature 004, Examples).
_CHALLENGE = {"WWW-Authenticate": "Bearer"}


def get_current_user(
    session: DbSession,
    bearer: Annotated[HTTPAuthorizationCredentials | None, Depends(_bearer)],
) -> CurrentUser:
    """The caller, upserted into `users` on the way through."""
    # * HTTPBearer yields None for anything that is not `Bearer <token>` — any other scheme, a bare scheme, a header with no scheme — so this one check covers every malformed header. Schemes are case-insensitive and it treats them so (RFC 7235).
    if bearer is None:
        raise _unauthenticated("Missing bearer token.")

    return resolve_current_user(session, verify_token(bearer.credentials))


def verify_token(token: str) -> TokenClaims:
    """Verify signature, time bounds, issuer and audience, then read the claims we keep.

    All four checks are firebase-admin's, against the configured project — a token minted for
    another Firebase project fails the audience check and never reaches a route.
    """
    try:
        # * check_revoked stays off (feature 004): it costs a network round trip per request, and tokens live at most an hour.
        decoded: dict[str, Any] = firebase_auth.verify_id_token(
            token, check_revoked=False
        )
    except firebase_auth.CertificateFetchError:
        # ! Not a 401: the token may be perfectly good and we simply cannot check it. Answering 401 would sign users out over a Google outage; 503 says "try again" and keeps the session.
        logger.warning("Could not fetch Firebase signing certificates", exc_info=True)
        raise AppError(
            ErrorCode.SERVICE_UNAVAILABLE,
            "Cannot verify credentials right now. Please try again.",
            status_code=503,
        ) from None
    except (ValueError, firebase_auth.InvalidIdTokenError) as exc:
        # * Info, not error: a bad token is the caller's problem, not the service's. ExpiredIdTokenError is an InvalidIdTokenError, so this covers expiry too.
        logger.info("Rejected bearer token: %s", type(exc).__name__)
        raise _unauthenticated("Invalid or expired token.") from None

    identities = decoded.get("firebase", {}).get("identities", {}).get("google.com", [])

    return TokenClaims(
        uid=decoded["sub"],
        email=decoded.get("email", ""),
        name=decoded.get("name"),
        google_sub=identities[0] if identities else None,
    )


def _unauthenticated(message: str) -> AppError:
    return AppError(
        ErrorCode.UNAUTHENTICATED, message, status_code=401, headers=_CHALLENGE
    )


# * The one spelling for "this route needs a signed-in caller".
CurrentUserDep = Annotated[CurrentUser, Depends(get_current_user)]
