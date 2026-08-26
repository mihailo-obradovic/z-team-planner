"""users

Revision ID: 6a34c1ca7f87
Revises:
Create Date: 2026-08-26 14:24:49.251295

The account record feature 004 declares. It arrives on feature 005's branch because a build
needs an owner to point at; the profile and deletion routes are still 004's.
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "6a34c1ca7f87"
down_revision: str | Sequence[str] | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("firebase_uid", sa.String(length=128), nullable=False),
        sa.Column("google_sub", sa.String(length=255), nullable=True),
        sa.Column("email", sa.String(length=320), nullable=False),
        sa.Column("display_name", sa.String(length=255), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "last_seen_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id", name="pk_users"),
        # ! The uid is what the upsert conflicts on, so uniqueness has to be the database's, not the service's — a service-level check alone is a race (architecture.md, Persistence).
        sa.UniqueConstraint("firebase_uid", name="uq_users_firebase_uid"),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table("users")
