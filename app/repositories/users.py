"""`users` — database operations only."""

from sqlalchemy import func
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session

from app.models import User


def upsert_by_firebase_uid(
    session: Session,
    *,
    firebase_uid: str,
    google_sub: str | None,
    email: str,
    display_name: str,
) -> User:
    """Insert the account on first sight, or refresh what Google owns on every later request.

    One statement rather than select-then-insert: two requests arriving together on a first
    sign-in would otherwise race, and the unique index would turn the loser into a 500.
    """
    statement = (
        insert(User)
        .values(
            firebase_uid=firebase_uid,
            google_sub=google_sub,
            email=email,
            display_name=display_name,
        )
        .on_conflict_do_update(
            index_elements=[User.firebase_uid],
            # ! google_sub is deliberately absent: it is captured at first sight and never rewritten, so the row keeps pointing at the same Google account even if a later token omits the identity claim.
            set_={
                "email": email,
                "display_name": display_name,
                "last_seen_at": func.now(),
            },
        )
        .returning(User)
    )

    return session.execute(statement).scalar_one()
