"""What a verified token carries, and who the request is."""

from uuid import UUID

from pydantic import BaseModel


class TokenClaims(BaseModel):
    """The claims this application reads out of a verified Firebase ID token."""

    uid: str
    email: str
    name: str | None = None
    # * The Google account id, from `firebase.identities`. Absent on a token that carries no Google identity claim.
    google_sub: str | None = None


class CurrentUser(BaseModel):
    """The caller, as the rest of the request sees them.

    Deliberately narrow: routes and services need an owner id, never the whole account row.
    """

    id: UUID
    firebase_uid: str
