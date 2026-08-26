"""Account builds: naming, the cap, idempotency, and the transaction boundaries.

Every rule that decides whether a write may happen lives here. Routes translate HTTP,
repositories talk to Postgres, and neither one decides anything.
"""

import hashlib
import json
from collections.abc import Callable
from datetime import UTC, datetime, timedelta
from typing import Any
from uuid import UUID

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.game_data import get_game_data
from app.exceptions.errors import AppError, ErrorCode
from app.models import Build
from app.repositories import builds as builds_repo
from app.repositories import idempotency as idempotency_repo
from app.schemas.builds import BuildOut, CreateBuildIn
from app.services.validation import validate_build_data

MAX_BUILDS = 20
IDEMPOTENCY_WINDOW = timedelta(hours=24)


def request_hash(payload: Any) -> str:
    """A fingerprint of the request body, so the same key with a different body is caught."""
    return hashlib.sha256(
        json.dumps(payload, sort_keys=True, separators=(",", ":")).encode("utf-8")
    ).hexdigest()


def free_name(taken: set[str], wanted: str) -> str:
    """`wanted`, or it with the smallest free ` (n)` suffix from 2 up.

    The loop is bounded by the cap: an account holds at most twenty names, so some `n` at or
    below 22 is always free (feature 005, Edge Cases).
    """
    if wanted not in taken:
        return wanted

    suffix = 2
    while f"{wanted} ({suffix})" in taken:
        suffix += 1

    return f"{wanted} ({suffix})"


def not_found() -> AppError:
    """Absence and "not yours" are the same answer — a 403 would confirm the build exists."""
    return AppError(ErrorCode.NOT_FOUND, "Build not found.", status_code=404)


def list_builds(
    session: Session, owner_id: UUID, page: int, page_size: int
) -> tuple[list[Build], int]:
    total = builds_repo.count_for_owner(session, owner_id)
    items = builds_repo.list_for_owner(
        session, owner_id, offset=(page - 1) * page_size, limit=page_size
    )

    return items, total


def get_build(session: Session, owner_id: UUID, build_id: UUID) -> Build:
    build = builds_repo.get_owned(session, owner_id, build_id)

    if build is None:
        raise not_found()

    return build


def run_idempotent(
    session: Session,
    owner_id: UUID,
    key: str,
    digest: str,
    produce: Callable[[], tuple[int, Any]],
) -> tuple[int, Any]:
    """Replay this key's stored response, or run `produce` once and store what it returned.

    The key is claimed *before* the work and in the same transaction, so a duplicate arriving
    concurrently blocks on the primary key until the first commits, then replays rather than
    working twice. Only successes are stored: a rejected document must be re-judged on the
    next attempt, not answered from a cache for twenty-four hours.
    """
    for _attempt in range(2):
        existing = idempotency_repo.get(session, owner_id, key)

        if existing is not None:
            if datetime.now(UTC) - existing.created_at > IDEMPOTENCY_WINDOW:
                # * Past the window, so the key means nothing any more and may be claimed afresh.
                idempotency_repo.delete(session, existing)
            elif existing.request_hash != digest:
                raise AppError(
                    ErrorCode.IDEMPOTENCY_CONFLICT,
                    "This Idempotency-Key was already used with a different request.",
                    status_code=409,
                )
            else:
                # * A committed row always carries its response: the claim and the response are written in one transaction, so a half-finished one was never visible.
                return existing.status_code or 200, existing.response

        try:
            claimed = idempotency_repo.claim(
                session, owner_id=owner_id, key=key, request_hash=digest
            )
        except IntegrityError:
            # * Lost the race to a concurrent request with this key. It has committed by now, so the next pass through the loop finds it and replays.
            session.rollback()
            continue

        try:
            status_code, body = produce()
        except Exception:
            # ! Roll back the claim too, or a rejected document would hold the key for a day and the client could never retry it.
            session.rollback()
            raise

        idempotency_repo.record(
            session, claimed, status_code=status_code, response=body
        )
        session.commit()

        return status_code, body

    # * Two passes is enough: the second only runs after a concurrent writer committed, and a third would mean the row vanished again, which nothing does.
    raise AppError(
        ErrorCode.IDEMPOTENCY_CONFLICT,
        "Could not settle this Idempotency-Key. Please retry.",
        status_code=409,
    )


def insert_named(
    session: Session, owner_id: UUID, name: str, data: dict[str, Any]
) -> Build:
    """Insert under the cap, with the first free name. Callers hold the transaction."""
    # * Serialises this account's creates: without it two requests each see nineteen builds and each insert the twentieth.
    builds_repo.lock_owner(session, owner_id)

    if builds_repo.count_for_owner(session, owner_id) >= MAX_BUILDS:
        raise AppError(
            ErrorCode.BUILD_LIMIT,
            f"You can keep up to {MAX_BUILDS} builds.",
            status_code=409,
        )

    final = free_name(builds_repo.names_for_owner(session, owner_id), name)

    return builds_repo.insert(session, owner_id=owner_id, name=final, data=data)


def create_build(
    session: Session, owner_id: UUID, payload: CreateBuildIn, idempotency_key: str
) -> tuple[int, dict[str, Any]]:
    """Create one build, once per `Idempotency-Key`."""

    def produce() -> tuple[int, dict[str, Any]]:
        document = validate_build_data(payload.data, get_game_data())
        build = insert_named(
            session, owner_id, payload.name, document.model_dump(exclude_unset=True)
        )

        return 201, BuildOut.model_validate(build).model_dump(mode="json")

    return run_idempotent(
        session,
        owner_id,
        idempotency_key,
        request_hash(payload.model_dump(mode="json")),
        produce,
    )
