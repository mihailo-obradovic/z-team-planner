"""The release number, read once from the repository's VERSION file.

`VERSION` is the one source of the number (decision 013); `package.json` and
`pyproject.toml` carry copies kept in step by hand.
"""

from pathlib import Path

# * Two levels up from app/core/ is the repository root, the same walk game_data.py makes to reach shared/.
VERSION_PATH = Path(__file__).resolve().parents[2] / "VERSION"


def read_version(path: Path) -> str:
    # ! No fallback: a deploy without VERSION is a broken deploy, and must fail at import like a missing setting.
    version = path.read_text(encoding="utf-8").strip()
    if not version:
        raise ValueError(f"{path} is empty")
    return version


APP_VERSION = read_version(VERSION_PATH)
