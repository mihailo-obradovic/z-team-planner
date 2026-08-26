"""The stored response behind `Idempotency-Key`.

A create or import retried after a network failure must return the original response rather
than make a second build (feature 005, Business Rules). The key plus the user identify that
response for 24 hours.
"""

from datetime import datetime
from typing import Any
from uuid import UUID

from sqlalchemy import DateTime, ForeignKey, Integer, String, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class IdempotencyKey(Base):
    __tablename__ = "idempotency_keys"

    # * The key is scoped to the user, so one caller's key can never replay another's response. Both columns are the primary key, which is also what a concurrent duplicate blocks on.
    owner_id: Mapped[UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    key: Mapped[str] = mapped_column(String(128), primary_key=True)
    # * The same key with a different body is a client bug, not a retry, and answers 409 — which needs the original request's fingerprint to detect.
    request_hash: Mapped[str] = mapped_column(String(64), nullable=False)
    # * Null until the work finishes: the row is claimed first, so a concurrent duplicate waits on the primary key rather than doing the work twice.
    status_code: Mapped[int | None] = mapped_column(Integer)
    response: Mapped[Any | None] = mapped_column(JSONB)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
