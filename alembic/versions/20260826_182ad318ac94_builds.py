"""builds

Revision ID: 182ad318ac94
Revises: 6a34c1ca7f87
Create Date: 2026-08-26 15:02:11.884213

The account build and the stored responses that make its create and import idempotent.
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "182ad318ac94"
down_revision: str | Sequence[str] | None = "6a34c1ca7f87"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        "builds",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("owner_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(length=90), nullable=False),
        sa.Column("data", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        # * GENERATED ALWAYS AS ... STORED: the column is derived from the document, so it can never drift from it.
        sa.Column(
            "format_version",
            sa.Integer(),
            sa.Computed("((data ->> 'v'))::integer", persisted=True),
            nullable=False,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["owner_id"],
            ["users.id"],
            name="fk_builds_owner_id_users",
            # * Feature 004's deletion promise: DELETE /me takes every build with it.
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name="pk_builds"),
        # ! Two concurrent creates would both find the same name free; only the database can settle that.
        sa.UniqueConstraint("owner_id", "name", name="uq_builds_owner_name"),
    )
    op.create_table(
        "idempotency_keys",
        sa.Column("owner_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("key", sa.String(length=128), nullable=False),
        sa.Column("request_hash", sa.String(length=64), nullable=False),
        sa.Column("status_code", sa.Integer(), nullable=True),
        sa.Column("response", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["owner_id"],
            ["users.id"],
            name="fk_idempotency_keys_owner_id_users",
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("owner_id", "key", name="pk_idempotency_keys"),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table("idempotency_keys")
    op.drop_table("builds")
