"""Pydantic DTOs for the builds resource — declared here, never inlined in a route."""

from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field


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
