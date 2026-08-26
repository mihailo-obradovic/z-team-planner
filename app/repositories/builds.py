"""`builds` — database operations only."""

from datetime import datetime
from typing import Any
from uuid import UUID

from sqlalchemy import delete, func, select, update
from sqlalchemy.orm import Session

from app.models import Build, User


def lock_owner(session: Session, owner_id: UUID) -> None:
    """Take a row lock on the account, serialising its concurrent creates.

    The cap and the name search both read the account's builds and then insert, so without
    this two requests can each see nineteen builds and each insert the twentieth.
    """
    session.execute(select(User.id).where(User.id == owner_id).with_for_update())


def count_for_owner(session: Session, owner_id: UUID) -> int:
    return session.execute(
        select(func.count()).select_from(Build).where(Build.owner_id == owner_id)
    ).scalar_one()


def names_for_owner(session: Session, owner_id: UUID) -> set[str]:
    return set(
        session.execute(select(Build.name).where(Build.owner_id == owner_id)).scalars()
    )


def list_for_owner(
    session: Session, owner_id: UUID, *, offset: int, limit: int
) -> list[Build]:
    """One page, newest-updated first (feature 005, Business Rules)."""
    return list(
        session.execute(
            select(Build)
            .where(Build.owner_id == owner_id)
            # * id as a tiebreaker: two builds can share a timestamp only if they were inserted in one statement, but an unstable sort would still page badly.
            .order_by(Build.updated_at.desc(), Build.id)
            .offset(offset)
            .limit(limit)
        )
        .scalars()
        .all()
    )


def get_owned(session: Session, owner_id: UUID, build_id: UUID) -> Build | None:
    """Absence and "belongs to someone else" are the same answer here — both are None."""
    return session.execute(
        select(Build).where(Build.id == build_id, Build.owner_id == owner_id)
    ).scalar_one_or_none()


def get_public(session: Session, build_id: UUID) -> Build | None:
    """The public read: by id alone, with no owner check — the id is the capability."""
    return session.execute(
        select(Build).where(Build.id == build_id)
    ).scalar_one_or_none()


def insert(
    session: Session, *, owner_id: UUID, name: str, data: dict[str, Any]
) -> Build:
    build = Build(owner_id=owner_id, name=name, data=data)
    session.add(build)
    # * Flush, then refresh: created_at, updated_at and the generated format_version are all written by Postgres, so the object does not carry them until it is read back.
    session.flush()
    session.refresh(build)

    return build


def update_guarded(
    session: Session,
    *,
    build_id: UUID,
    owner_id: UUID,
    expected_updated_at: datetime,
    name: str,
    data: dict[str, Any],
) -> Build | None:
    """Update only while the row still carries the timestamp the caller last read.

    One statement, so two writers cannot both win: whoever arrives second matches no row and
    gets None, which the service turns into the 412 carrying the current build.
    """
    updated = session.execute(
        update(Build)
        .where(
            Build.id == build_id,
            Build.owner_id == owner_id,
            Build.updated_at == expected_updated_at,
        )
        .values(name=name, data=data, updated_at=func.now())
        .returning(Build.id)
    ).scalar_one_or_none()

    if updated is None:
        return None

    # * Expire first: this row was changed by a Core statement the identity map knows nothing about.
    session.expire_all()

    return get_owned(session, owner_id, build_id)


def delete_owned(session: Session, owner_id: UUID, build_id: UUID) -> bool:
    """True when a row was removed; False when there was nothing of theirs to remove."""
    # * RETURNING rather than rowcount: the same round trip, and it types cleanly.
    removed = session.execute(
        delete(Build)
        .where(Build.id == build_id, Build.owner_id == owner_id)
        .returning(Build.id)
    ).scalar_one_or_none()

    return removed is not None
