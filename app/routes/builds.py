"""`/api/v1/builds` — transport only, no business logic."""

from typing import Annotated, Any
from uuid import UUID

from fastapi import APIRouter, Header, Query, Response, status
from fastapi.responses import JSONResponse

from app.auth import CurrentUserDep
from app.core.database import DbSession
from app.schemas.builds import (
    BuildListOut,
    BuildOut,
    BuildSummaryOut,
    CreateBuildIn,
    UpdateBuildIn,
)
from app.services import builds as builds_service

router = APIRouter(prefix="/builds", tags=["builds"])

# * Required, so a create with no key is a 422 naming the header rather than a silent second build on the next retry.
IdempotencyKeyHeader = Annotated[
    str, Header(alias="Idempotency-Key", min_length=1, max_length=128)
]


def with_etag(body: dict[str, Any], status_code: int = 200) -> JSONResponse:
    """A build response and the `ETag` a later `If-Match` is compared against.

    The header is the body's own `updated_at`, character for character, so a client can hand
    back what it was given without reformatting it.
    """
    response = JSONResponse(status_code=status_code, content=body)
    response.headers["ETag"] = body["updated_at"]

    return response


@router.get("", response_model=BuildListOut, summary="List the account's builds")
def list_builds(
    session: DbSession,
    user: CurrentUserDep,
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=100)] = 20,
) -> BuildListOut:
    items, total = builds_service.list_builds(session, user.id, page, page_size)

    return BuildListOut(
        items=[BuildSummaryOut.model_validate(build) for build in items],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
    response_model=BuildOut,
    summary="Create a build",
)
def create_build(
    session: DbSession,
    user: CurrentUserDep,
    payload: CreateBuildIn,
    idempotency_key: IdempotencyKeyHeader,
) -> JSONResponse:
    status_code, body = builds_service.create_build(
        session, user.id, payload, idempotency_key
    )

    return with_etag(body, status_code)


@router.get("/{build_id}", response_model=BuildOut, summary="Read one build")
def get_build(session: DbSession, user: CurrentUserDep, build_id: UUID) -> JSONResponse:
    build = builds_service.get_build(session, user.id, build_id)

    return with_etag(BuildOut.model_validate(build).model_dump(mode="json"))


@router.patch(
    "/{build_id}",
    response_model=BuildOut,
    # * The 412 answers with a build, not the error envelope — declared so OpenAPI says so too.
    responses={412: {"model": BuildOut, "description": "Someone else saved first"}},
    summary="Rename a build, replace its document, or both",
)
def update_build(
    session: DbSession,
    user: CurrentUserDep,
    build_id: UUID,
    payload: UpdateBuildIn,
    if_match: Annotated[str | None, Header(alias="If-Match")] = None,
) -> JSONResponse:
    try:
        build = builds_service.update_build(
            session, user.id, build_id, if_match, payload
        )
    except builds_service.StaleBuildError as conflict:
        # ! The one place a failure does not carry the error envelope: the client needs the other device's document to offer "reload theirs", and its ETag to save over it.
        return with_etag(
            BuildOut.model_validate(conflict.build).model_dump(mode="json"),
            status.HTTP_412_PRECONDITION_FAILED,
        )

    return with_etag(BuildOut.model_validate(build).model_dump(mode="json"))


@router.delete(
    "/{build_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a build",
)
def delete_build(session: DbSession, user: CurrentUserDep, build_id: UUID) -> Response:
    builds_service.delete_build(session, user.id, build_id)

    # * 204, so there is no body and nothing to parse — and the share link is a 404 from now on.
    return Response(status_code=status.HTTP_204_NO_CONTENT)
