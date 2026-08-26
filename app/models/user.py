"""The `users` row — feature 004's record, created here because `builds.owner_id` needs it.

Feature 004 owns what this row means and its personal-data declaration; this feature only
needs it to exist, so that a build has an owner. `/me` and account deletion arrive with 004.
"""

from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import DateTime, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class User(Base):
    __tablename__ = "users"

    # * A surrogate key rather than the uid itself: the Firebase uid is a vendor identifier, and a foreign key on every build should not be the thing that changes if identity ever moves (decision 004).
    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    # * The token's `sub`, and the only join key between the two systems (feature 004, Invariants).
    firebase_uid: Mapped[str] = mapped_column(String(128), unique=True, nullable=False)
    # ! Captured from `firebase.identities` at first sight and never rewritten. The token's sub is a Firebase uid, not the Google account id, so keying only on the uid would recreate the lock-in decision 004 avoids.
    google_sub: Mapped[str | None] = mapped_column(String(255))
    email: Mapped[str] = mapped_column(String(320), nullable=False)
    # * Mirrors Google and is not editable; falls back to the email's local part when Google has none (feature 004, Edge Cases).
    display_name: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    last_seen_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
