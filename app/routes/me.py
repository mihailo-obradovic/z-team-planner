"""`/api/v1/me` — the signed-in account. Transport only, no business logic."""

from fastapi import APIRouter

from app.auth import CurrentUserDep
from app.core.database import DbSession
from app.schemas.me import MeOut
from app.services import users as users_service

router = APIRouter(prefix="/me", tags=["me"])


@router.get("", response_model=MeOut, summary="The signed-in account")
def read_me(session: DbSession, user: CurrentUserDep) -> MeOut:
    # * The row is already there: naming CurrentUserDep is what upserts it, so a never-seen account's first request to any endpoint creates it (feature 004, Examples).
    row, build_count = users_service.get_profile(session, user.id)

    return MeOut(
        display_name=row.display_name,
        email=row.email,
        created_at=row.created_at,
        build_count=build_count,
    )
