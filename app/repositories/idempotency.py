"""`idempotency_keys` — database operations only."""

from typing import Any
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import IdempotencyKey


def get(session: Session, owner_id: UUID, key: str) -> IdempotencyKey | None:
    return session.execute(
        select(IdempotencyKey).where(
            IdempotencyKey.owner_id == owner_id, IdempotencyKey.key == key
        )
    ).scalar_one_or_none()


def claim(
    session: Session, *, owner_id: UUID, key: str, request_hash: str
) -> IdempotencyKey:
    """Reserve the key before doing the work.

    Inserted with no response yet, so a concurrent request carrying the same key blocks on the
    primary key until this transaction commits, and then replays instead of working twice.
    Raises `IntegrityError` when the key is already claimed.
    """
    row = IdempotencyKey(owner_id=owner_id, key=key, request_hash=request_hash)
    session.add(row)
    session.flush()

    return row


def record(
    session: Session, row: IdempotencyKey, *, status_code: int, response: Any
) -> None:
    """Attach the response the next replay will return."""
    row.status_code = status_code
    row.response = response
    session.flush()


def delete(session: Session, row: IdempotencyKey) -> None:
    """Drop a key whose window has passed, so it can be claimed afresh."""
    session.delete(row)
    session.flush()
