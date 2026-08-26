"""The 422 `path` renderer, against feature 005's documented examples."""

import pytest

from app.exceptions.handlers import _location_to_path


@pytest.mark.parametrize(
    ("location", "expected"),
    [
        # * Straight from feature 005's Examples table.
        (("body", "data", "lu", "coupe", "combat"), "data.lu.coupe.combat"),
        (("body", "data", "fl", 0), "data.fl[0]"),
        (("body", "data", "pw", "waterboy"), "data.pw.waterboy"),
        (("body", "data", "v"), "data.v"),
        # * The batch-cap row: "import of 51 items -> 422, path `$`".
        (("body",), "$"),
        # * Other transports lose their segment the same way.
        (("query", "page_size"), "page_size"),
        (("path", "id"), "id"),
        (("header", "if-match"), "if-match"),
        # * Nested indexing.
        (("body", "items", 3, "name"), "items[3].name"),
        (("body", "a", 0, 1), "a[0][1]"),
        # * A loc that never had a transport segment is left alone.
        (("data", "v"), "data.v"),
    ],
)
def test_renders_documented_paths(
    location: tuple[int | str, ...], expected: str
) -> None:
    assert _location_to_path(location) == expected


def test_empty_location_is_the_document_root() -> None:
    assert _location_to_path(()) == "$"
