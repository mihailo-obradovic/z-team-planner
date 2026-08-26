"""Resolving a verified token to an account row, and what the account itself can do.

The owner a build hangs off (feature 005) and the profile read (feature 004) are the same
row, so both live here.
"""

from uuid import UUID

from sqlalchemy.orm import Session

from app.auth.schemas import CurrentUser, TokenClaims
from app.exceptions.errors import AppError, ErrorCode
from app.models import User
from app.repositories import builds as builds_repo
from app.repositories import users as users_repo


def resolve_current_user(session: Session, claims: TokenClaims) -> CurrentUser:
    """Upsert the caller's row and return the identity the rest of the request uses."""
    # * A Google account with no display name falls back to the email's local part (feature 004, Edge Cases).
    display_name = claims.name or claims.email.split("@", 1)[0]

    user = users_repo.upsert_by_firebase_uid(
        session,
        firebase_uid=claims.uid,
        google_sub=claims.google_sub,
        email=claims.email,
        display_name=display_name,
    )

    # * The transaction boundary is here, not in get_db: the upsert is this request's own unit of work and must be durable before the route acts on the owner id.
    session.commit()

    return CurrentUser(id=user.id, firebase_uid=user.firebase_uid)


def get_profile(session: Session, owner_id: UUID) -> tuple[User, int]:
    """The account row and how many builds hang off it."""
    user = users_repo.get_by_id(session, owner_id)

    if user is None:
        # ! Only reachable if the account was deleted between the auth dependency's upsert and this line — the caller's own DELETE /me racing their own GET /me. 404 rather than 500: the account really is gone.
        raise AppError(
            ErrorCode.NOT_FOUND, "This account no longer exists.", status_code=404
        )

    return user, builds_repo.count_for_owner(session, owner_id)
