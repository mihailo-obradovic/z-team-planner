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

from pydantic import TypeAdapter, ValidationError
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.game_data import get_game_data
from app.exceptions.errors import AppError, ErrorCode, ErrorDetail
from app.models import Build
from app.repositories import builds as builds_repo
from app.repositories import idempotency as idempotency_repo
from app.schemas.builds import (
    BuildName,
    BuildOut,
    CreateBuildIn,
    ImportBuildsIn,
    ImportItemOut,
    UpdateBuildIn,
)
from app.services.validation import validate_build_data

MAX_BUILDS = 20
IDEMPOTENCY_WINDOW = timedelta(hours=24)

# * The single-create route lets Pydantic hold the name at the boundary; import has to apply the same rule per item, so the rule itself is reused rather than restated.
_NAME = TypeAdapter(BuildName)


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


class StaleBuildError(Exception):
    """`If-Match` did not name the current version.

    Carried as an exception rather than a return value because the route answers it with the
    build itself, not the error envelope — the client needs the other device's document to
    offer "reload theirs" (feature 005, User / System Behavior).
    """

    def __init__(self, build: Build) -> None:
        super().__init__("stale If-Match")
        self.build = build


def not_found() -> AppError:
    """Absence and "not yours" are the same answer — a 403 would confirm the build exists."""
    return AppError(ErrorCode.NOT_FOUND, "Build not found.", status_code=404)


def list_builds(session: Session, owner_id: UUID) -> tuple[list[Build], int]:
    total = builds_repo.count_for_owner(session, owner_id)
    items = builds_repo.list_for_owner(session, owner_id)

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


def parse_if_match(value: str) -> datetime | None:
    """The instant an `If-Match` names, or None when it names nothing this server wrote.

    A bare `updated_at` is what the client is given and what it sends back; a quoted or weak
    entity-tag is tolerated because intermediaries add those. Anything unparseable, or without
    an offset, is not the current version and is treated as stale rather than as a bad request.
    """
    candidate = value.strip().removeprefix("W/").strip('"')

    try:
        parsed = datetime.fromisoformat(candidate)
    except ValueError:
        return None

    # ! Naive datetimes are refused rather than assumed to be UTC: comparing one to the stored aware timestamp raises, and guessing an offset could let a stale write through.
    return parsed if parsed.tzinfo is not None else None


def update_build(
    session: Session,
    owner_id: UUID,
    build_id: UUID,
    if_match: str | None,
    payload: UpdateBuildIn,
) -> Build:
    """Rename, replace the document, or both — only if the caller holds the current version."""
    if if_match is None:
        # * Refused rather than defaulted: an unconditional PATCH is exactly the lost update this guard exists to prevent.
        raise AppError(
            ErrorCode.PRECONDITION_REQUIRED,
            "If-Match is required. Send the ETag from your last read.",
            status_code=428,
        )

    build = get_build(session, owner_id, build_id)
    expected = parse_if_match(if_match)

    if expected is None or expected != build.updated_at:
        # * Before validating the document: a caller whose version is stale must reconcile first, and the document they are holding may not be the one they end up keeping.
        raise StaleBuildError(build)

    data = build.data

    if payload.data is not None:
        data = validate_build_data(payload.data, get_game_data()).model_dump(
            exclude_unset=True
        )

    name = build.name

    if payload.name is not None and payload.name != build.name:
        builds_repo.lock_owner(session, owner_id)
        # * Its own name is excluded, or a rename that only changes case or spacing would collide with itself.
        name = free_name(
            builds_repo.names_for_owner(session, owner_id) - {build.name}, payload.name
        )

    if name == build.name and payload.data is None:
        # * Nothing to write. A rename to the build's own name is a no-op 200, and its ETag stays valid (feature 005, Edge Cases).
        return build

    updated = builds_repo.update_guarded(
        session,
        build_id=build_id,
        owner_id=owner_id,
        expected_updated_at=build.updated_at,
        name=name,
        data=data,
    )

    if updated is None:
        # ! Someone committed between the check above and this statement. The guarded UPDATE is what actually settles it — the earlier comparison is only a fast path.
        session.rollback()
        raise StaleBuildError(get_build(session, owner_id, build_id))

    session.commit()

    return updated


def delete_build(session: Session, owner_id: UUID, build_id: UUID) -> None:
    """Remove one of the caller's builds. Deleting the same build twice is a 404, not a 500."""
    if not builds_repo.delete_owned(session, owner_id, build_id):
        raise not_found()

    session.commit()


def validate_name(raw: str) -> str:
    """The trimmed name, or a 422 naming the field — the same rule `CreateBuildIn` applies."""
    try:
        return _NAME.validate_python(raw)
    except ValidationError as exc:
        raise AppError(
            ErrorCode.VALIDATION_FAILED,
            "Validation failed.",
            status_code=422,
            details=[
                ErrorDetail(path="name", message=error["msg"]) for error in exc.errors()
            ],
        ) from None


def import_builds(
    session: Session,
    owner_id: UUID,
    payload: ImportBuildsIn,
    idempotency_key: str,
) -> tuple[int, list[dict[str, Any]]]:
    """Create what can be created, and say per item what happened to the rest.

    The batch answers `200` whatever the items did: a report of outcomes is the result, not a
    failure. Only a request the server could not read at all — too many items — is an error.
    """

    def produce() -> tuple[int, list[dict[str, Any]]]:
        report: list[ImportItemOut] = []

        for index, item in enumerate(payload.builds):
            try:
                # * A savepoint per item, so a failure at item 3 rolls back item 3 alone and leaves 1 and 2 exactly as they were (feature 005, Edge Cases).
                with session.begin_nested():
                    name = validate_name(item.name)
                    document = validate_build_data(item.data, get_game_data())
                    build = insert_named(
                        session, owner_id, name, document.model_dump(exclude_unset=True)
                    )

                report.append(
                    ImportItemOut(
                        index=index, status="created", id=build.id, name=build.name
                    )
                )
            except AppError as rejected:
                # * A rejection that names no field — the cap, an oversized document — is reported against the item as a whole.
                report.append(
                    ImportItemOut(
                        index=index,
                        status="invalid",
                        errors=rejected.details
                        or [ErrorDetail(path="$", message=rejected.message)],
                    )
                )

        return 200, [item.model_dump(mode="json", exclude_none=True) for item in report]

    return run_idempotent(
        session,
        owner_id,
        idempotency_key,
        request_hash(payload.model_dump(mode="json")),
        produce,
    )
