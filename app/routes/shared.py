"""`/api/v1/shared/{id}` — the public read behind a share link.

The only route reachable without an account. It names no `CurrentUserDep`: an unguessable id
is the whole access control, and the response never says who owns the build.
"""

from uuid import UUID

from fastapi import APIRouter, Depends, Request

from app.core.database import DbSession
from app.exceptions.errors import AppError, ErrorCode
from app.repositories import builds as builds_repo
from app.schemas.builds import PublicBuildOut
from app.utils.ratelimit import TokenBucketLimiter

router = APIRouter(prefix="/shared", tags=["shared"])


def rate_limited(request: Request) -> None:
    """Refuse a caller that is asking too often. A stopgap until the edge exists."""
    # ! The socket peer, which behind a proxy is the proxy. Correct only for as long as nothing sits in front of this process — which is exactly the stopgap's lifetime.
    client = request.client.host if request.client else "unknown"
    limiter: TokenBucketLimiter = request.app.state.shared_limiter

    if not limiter.allow(client):
        raise AppError(
            ErrorCode.RATE_LIMITED,
            "Too many requests. Please try again in a minute.",
            status_code=429,
        )


@router.get(
    "/{build_id}",
    response_model=PublicBuildOut,
    dependencies=[Depends(rate_limited)],
    summary="Read a shared build",
)
def read_shared_build(session: DbSession, build_id: UUID) -> PublicBuildOut:
    build = builds_repo.get_public(session, build_id)

    if build is None:
        # * The same answer for never-existed and deleted: a share link to a build its owner removed is simply gone.
        raise AppError(ErrorCode.NOT_FOUND, "Build not found.", status_code=404)

    return PublicBuildOut.model_validate(build)
