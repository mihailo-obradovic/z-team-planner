"""The `builds` row — one per account build.

The document itself is opaque to the database (feature 005, Non-goals): nothing queries into
it, so it is stored whole and returned unchanged.
"""

from datetime import datetime
from typing import Any
from uuid import UUID, uuid4

from sqlalchemy import (
    Computed,
    DateTime,
    ForeignKey,
    Integer,
    String,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class Build(Base):
    __tablename__ = "builds"
    __table_args__ = (
        # ! Name uniqueness is the database's, not the service's. The service picks a free name before inserting, but two concurrent creates would both find the same one free — a service-level check alone is a race, not enforcement (architecture.md, Persistence).
        UniqueConstraint("owner_id", "name", name="uq_builds_owner_name"),
    )

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    # * CASCADE is feature 004's deletion promise: removing the account removes every build with it, in the same statement.
    owner_id: Mapped[UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    # * 90, not 80: the client's limit is 80 characters, and a colliding 80-character name comes back suffixed with " (n)" (feature 005, Edge Cases).
    name: Mapped[str] = mapped_column(String(90), nullable=False)
    data: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False)
    # * Generated from the document rather than written beside it, so the column cannot disagree with what it describes.
    format_version: Mapped[int] = mapped_column(
        Integer, Computed("((data ->> 'v'))::integer", persisted=True), nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    # ! The ETag. Postgres writes it, so two updates to one row can never share a value, which is what makes If-Match a real lost-update guard.
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # * No separate index on owner_id: uq_builds_owner_name is a btree led by owner_id, so it already serves "this account's builds", and the cap keeps that at twenty rows.
