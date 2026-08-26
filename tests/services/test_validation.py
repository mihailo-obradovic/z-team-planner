"""Every row of shared/build-cases.json: the valid ones pass, the invalid ones fail on
exactly the expected paths.

The other half of the same fixture is `test/nuxt/build-cases.test.ts`, which proves the
planner cannot produce what this file rejects.
"""

import json
from pathlib import Path
from typing import Any

import pytest

from app.core.game_data import get_game_data
from app.exceptions.errors import AppError, ErrorCode
from app.services.validation import MAX_DOCUMENT_BYTES, validate_build_data

CASES: list[dict[str, Any]] = json.loads(
    (Path(__file__).resolve().parents[2] / "shared" / "build-cases.json").read_text(
        encoding="utf-8"
    )
)["cases"]

VALID = [case for case in CASES if case["valid"]]
INVALID = [case for case in CASES if not case["valid"]]


def _validate(raw: Any) -> Any:
    return validate_build_data(raw, get_game_data())


@pytest.mark.parametrize("case", VALID, ids=[case["name"] for case in VALID])
def test_an_accepted_document_survives_unchanged(case: dict[str, Any]) -> None:
    document = _validate(case["data"])

    # * What was validated is what is stored: no key added, none dropped, no value coerced.
    assert document.model_dump(exclude_unset=True) == case["data"]


@pytest.mark.parametrize("case", INVALID, ids=[case["name"] for case in INVALID])
def test_a_rejected_document_names_every_bad_path(case: dict[str, Any]) -> None:
    with pytest.raises(AppError) as raised:
        _validate(case["data"])

    error = raised.value

    assert error.status_code == 422
    assert error.code is ErrorCode.VALIDATION_FAILED
    # ! The exact set, not a subset: a client renders one message per field, so a path the
    # ! server invents is a message with nowhere to go, and one it misses is a silent failure.
    assert sorted(detail.path for detail in error.details or []) == sorted(
        case["paths"]
    )
    assert all(detail.message for detail in error.details or [])


def test_the_fixture_covers_both_verdicts() -> None:
    # * Guards against a fixture edit that empties one side and leaves the suite green.
    assert len(VALID) >= 5
    assert len(INVALID) >= 20


def test_an_oversized_document_is_413_before_any_field_error() -> None:
    # * A 9 KB document is structurally invalid too (that padding key is unknown); the contract answers size first, and with 413 rather than a list of field errors.
    raw = {"v": 1, "padding": "a" * (MAX_DOCUMENT_BYTES + 1)}

    with pytest.raises(AppError) as raised:
        _validate(raw)

    assert raised.value.status_code == 413
    assert raised.value.code is ErrorCode.PAYLOAD_TOO_LARGE
    assert raised.value.details is None


def test_a_document_at_the_size_limit_is_accepted() -> None:
    # * The boundary itself is inside the limit — "may not exceed" is not "must be under".
    padding = MAX_DOCUMENT_BYTES - len(
        json.dumps({"v": 1, "ec": ""}, separators=(",", ":"))
    )
    raw = {"v": 1, "ec": "c" * padding}

    from app.services.validation import document_bytes

    assert document_bytes(raw) == MAX_DOCUMENT_BYTES

    with pytest.raises(AppError) as raised:
        _validate(raw)

    # * Rejected for what it says, not for its size.
    assert raised.value.status_code == 422


def test_a_document_that_is_not_an_object_is_a_structure_error() -> None:
    with pytest.raises(AppError) as raised:
        _validate([1, 2])  # pyright: ignore[reportArgumentType]

    assert raised.value.status_code == 422
    assert [detail.path for detail in raised.value.details or []] == ["data"]


def test_no_value_is_coerced() -> None:
    # ! Lax Pydantic would read "2" as 2 and true as 1, storing something the client never
    # ! sent and quietly breaking the round-trip invariant. Strict mode is what stops that.
    for raw in ({"v": 1, "bl": {"golem": "2"}}, {"v": 1, "bl": {"golem": True}}):
        with pytest.raises(AppError) as raised:
            _validate(raw)

        assert raised.value.status_code == 422
        assert [detail.path for detail in raised.value.details or []] == [
            "data.bl.golem"
        ]


def test_every_failure_is_reported_at_once() -> None:
    # * One response tells the client everything wrong below the identity tier, so a user does not fix one field only to meet the next rejection.
    raw = {"v": 1, "bl": {"golem": 3, "prism": 2}, "fl": ["golem"]}

    with pytest.raises(AppError) as raised:
        _validate(raw)

    assert sorted(detail.path for detail in raised.value.details or []) == [
        "data.bl",
        "data.fl[0]",
    ]


def test_an_unknown_hero_stops_before_the_later_tiers() -> None:
    # ! Identity runs alone because every tier below indexes the game data by hero id; without the stop this document would raise KeyError instead of answering 422.
    raw = {"v": 1, "lu": {"batman": [99, 0, 0, 0, 0]}}

    with pytest.raises(AppError) as raised:
        _validate(raw)

    assert [detail.path for detail in raised.value.details or []] == ["data.lu.batman"]
