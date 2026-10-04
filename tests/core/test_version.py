"""The release number, read once from the repository's VERSION file."""

import re
from pathlib import Path

import pytest

from app.core.version import APP_VERSION, VERSION_PATH, read_version


def test_the_version_is_the_file_contents_without_the_newline() -> None:
    assert VERSION_PATH.read_text(encoding="utf-8").strip() == APP_VERSION


def test_the_version_is_plain_semver() -> None:
    # ! No `v` prefix: the tag hooks add it, and `package.json` once carried `v0.0.1` by mistake.
    assert re.fullmatch(r"\d+\.\d+\.\d+", APP_VERSION)


def test_a_missing_file_fails_loudly(tmp_path: Path) -> None:
    with pytest.raises(FileNotFoundError):
        read_version(tmp_path / "VERSION")


def test_an_empty_file_fails_loudly(tmp_path: Path) -> None:
    path = tmp_path / "VERSION"
    path.write_text("\n", encoding="utf-8")
    with pytest.raises(ValueError, match="empty"):
        read_version(path)
