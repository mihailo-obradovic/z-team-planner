"""Pydantic DTOs for the builds resource — declared here, never inlined in a route."""

from datetime import UTC, datetime
from typing import Annotated, Any, Literal
from uuid import UUID

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    StringConstraints,
    field_serializer,
)

from app.exceptions.errors import ErrorDetail

# * Trimmed, then 1–80 characters — the same rule the build-name form mirrors (feature 008).
BuildName = Annotated[
    str, StringConstraints(strip_whitespace=True, min_length=1, max_length=80)
]


class BuildDocument(BaseModel):
    """Validation tier (i), structure: the keys of `SerializedBuild` v1, and nothing else.

    The format itself is feature 001's and is a protected area — this model reads those keys,
    it never adds one. Every key but `v` is optional, because the serializer omits defaults.
    """

    # * `extra="forbid"` is the tier: an unknown key is a rejected document, not a dropped one.
    # ! `strict=True` so no value is quietly coerced. The stored document must mean exactly what the client sent — lax mode would turn "2" into 2 and true into 1, and the round-trip invariant would be silently false.
    model_config = ConfigDict(extra="forbid", strict=True)

    v: Literal[1]
    # * "" means absent: the serializer omits an episode choice that is still the default.
    ec: str = ""
    eh: str = ""
    e8: Literal[1] | None = None
    lu: dict[str, list[int]] = Field(default_factory=dict)
    bl: dict[str, int] = Field(default_factory=dict)
    pw: dict[str, list[int]] = Field(default_factory=dict)
    sp: dict[str, int] = Field(default_factory=dict)
    fl: list[str] = Field(default_factory=list)

    def trained_slot(self, hero: str) -> int:
        """Which trainable power the hero holds, or 0 — safe on a malformed pair."""
        pair = self.pw.get(hero, [])

        return pair[1] if len(pair) == 2 else 0


# * The raw document as it arrives and as it is stored: validation reads it through
# * BuildDocument, but what goes into the column is the caller's own object (feature 005,
# * Invariants — `data` round-trips, the server never normalizes it).
RawDocument = dict[str, Any]


def render_timestamp(moment: datetime) -> str:
    """UTC, ISO-8601, always six microsecond digits and a `Z`.

    One rendering for the body and for the `ETag`, so a client can hand back exactly what it
    was given and `If-Match` compares equal. `datetime.fromisoformat` reads it back.
    """
    return moment.astimezone(UTC).strftime("%Y-%m-%dT%H:%M:%S.%f") + "Z"


class _FromRow(BaseModel):
    """Shared serialization for anything read straight off a `builds` row."""

    model_config = ConfigDict(from_attributes=True)

    @field_serializer("created_at", "updated_at", check_fields=False)
    def _stamp(self, value: datetime) -> str:
        return render_timestamp(value)


class BuildSummaryOut(_FromRow):
    """A list item: everything but the document, which no list needs to carry."""

    id: UUID
    name: str
    format_version: int
    created_at: datetime
    updated_at: datetime


class BuildOut(BuildSummaryOut):
    data: dict[str, Any]


class PublicBuildOut(_FromRow):
    """The public read — never the owner, and never when it was created (feature 007)."""

    id: UUID
    name: str
    data: dict[str, Any]
    updated_at: datetime


class BuildListOut(BaseModel):
    items: list[BuildSummaryOut]
    total: int
    page: int
    page_size: int


class CreateBuildIn(BaseModel):
    name: BuildName
    # * Raw on purpose: the 8 KB rule has to run before structural parsing, so that an oversized document answers 413 rather than a list of field errors (services/validation.py).
    data: dict[str, Any]


class UpdateBuildIn(BaseModel):
    """A rename, a new document, or both — an absent key means "leave it alone"."""

    name: BuildName | None = None
    data: dict[str, Any] | None = None


class ImportItemIn(BaseModel):
    """One item of an import.

    `name` is a plain string here, unlike `CreateBuildIn`: import succeeds per item, and a
    single unusable name must not cost the caller every other build in the batch. It is held
    to the same rule inside the loop, where the failure lands on that item's report row.
    """

    name: str
    data: dict[str, Any]


class ImportBuildsIn(BaseModel):
    # * The batch cap is declared here, so an oversized import is refused at the boundary before a single item is validated or inserted.
    builds: list[ImportItemIn] = Field(max_length=50)


class ImportItemOut(BaseModel):
    """One item's outcome. Import succeeds per item, so a report carries both verdicts."""

    index: int
    status: Literal["created", "invalid"]
    id: UUID | None = None
    name: str | None = None
    errors: list[ErrorDetail] | None = None
