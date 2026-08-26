"""The profile DTO — feature 004's `/me` shape."""

from datetime import datetime

from pydantic import BaseModel, field_serializer

from app.schemas.builds import render_timestamp


class MeOut(BaseModel):
    """The four fields the header and the delete dialog need.

    Deliberately not the `users` row: `firebase_uid` and `google_sub` are join keys between
    the two systems, and no client has a use for either (feature 004, Outputs).
    """

    display_name: str
    email: str
    created_at: datetime
    build_count: int

    # * The builds resource's rendering, not a second one: one timestamp format across the API is what lets a client parse every response the same way.
    @field_serializer("created_at")
    def _stamp(self, value: datetime) -> str:
        return render_timestamp(value)
