# Toolchain: Dependencies, Lint & Format — uv + Ruff + pyright

**Tier:** Language — Python

Every Python stack manages dependencies and interpreters with **uv**, lints and formats with **Ruff**, and type-checks with **pyright**. Format with `ruff format`; do not hand-format. Ruff owns what Black, isort, and flake8 used to split between them — none of the three is ever added back.

`pyproject.toml` is the single config home for all of it, and it is **the project's own from spawn onward** — the scaffolder writes none of it and no upgrade regenerates it. Per-tool config files (`ruff.toml`, `setup.cfg`, `.flake8`, `pyrightconfig.json`) are not added alongside it; a second config home is how the two drift.

## Dependencies

- `uv.lock` is committed and is the single source of pinned versions (the reproducible-builds rule made concrete). CI and images install with `uv sync --locked`, which fails on a stale lockfile instead of silently resolving different versions.
- Runtime dependencies live in `[project.dependencies]`, everything else in `[dependency-groups]` (`uv add --dev <pkg>`) so a production install can drop them.
- Adding a dependency is still governed by the Dependency Change Rule (`architecture.md`) — uv makes it one command, not a smaller decision.

## Python Version

`requires-python` in `pyproject.toml` is the floor and the only one: uv resolves and provisions an interpreter that satisfies it, `.python-version` pins which one this repository uses, and Ruff reads `requires-python` for its `target-version` rather than being told twice. The floor is the adopting module's (`stacks/backend/python-fastapi.md` for the default backend); raising it is a deliberate act, never routine maintenance.

## Lint & Format

- `ruff check` lints, `ruff format` formats — one binary, Black-compatible output, 4-space indentation in agreement with the `[*.py]` section of `.editorconfig` ([`conventions/editor-setup.md`](../../../conventions/editor-setup.md)).
- Ruff's defaults are the house style; `pyproject.toml` states only what the project chooses differently.
- The `[tool.ruff.lint]` `select` floor is `["E", "F", "I", "UP", "B"]` — pycodestyle and Pyflakes (definitely-wrong code, the floor's own reason), isort (import order is a format concern, not a review one), pyupgrade (syntax that the pinned floor already supports), and bugbear (the bug classes a type checker does not see). Stricter rule sets are the project's own opt-in, rule by rule.

## Types

pyright at `basic` runs over the project in CI and in the editor; `strict` is a per-project or per-directory opt-in, not the entry price. Errors it reports are fixed by typing the code, not by widening to `Any` or silencing with a bare `# type: ignore` — a silenced error carries the rule code and the reason ([`conventions/code-annotations.md`](../../../conventions/code-annotations.md)). Astral's `ty` is not adopted while it is in preview.

## Verbs

Python has no `package.json` script block, so the verbs are the commands themselves — humans, agents, and CI run these and nothing else:

| Verb           | Command                        |
| -------------- | ------------------------------ |
| `lint`         | `uv run ruff check .`          |
| `lint:fix`     | `uv run ruff check --fix .`    |
| `format`       | `uv run ruff format .`         |
| `format:check` | `uv run ruff format --check .` |
| `typecheck`    | `uv run pyright`               |
| `test`         | `uv run pytest`                |

A project that wants shorter names puts them in a `Makefile` or task runner of its own choosing; the commands above stay the definition.
