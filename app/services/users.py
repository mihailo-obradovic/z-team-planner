"""Resolving a verified token to an account row.

Feature 004 extends this with the profile read and the deletion cascade; feature 005 needs
only the owner a build hangs off.
"""

from sqlalchemy.orm import Session

from app.auth.schemas import CurrentUser, TokenClaims
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
