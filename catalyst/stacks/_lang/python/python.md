# Tier: Language — Python

**Tier:** Language — Python

Shared language-level conventions and toolchain for every stack that ships Python — backend, workers, scripts, framework-agnostic. This directory is never a spawn choice; it travels automatically with any module whose `**Requires:**` header names `_lang/python`.

Nothing here restates a Universal Rule or a framework rule: framework-specific guidance lives with the module that requires this tier (e.g. FastAPI structure and tool bindings in [`../../backend/python-fastapi.md`](../../backend/python-fastapi.md), Celery task rules in [`../../workers/celery.md`](../../workers/celery.md)).

## Module Documents

| Document       | What it holds                                                         | Load                                                                                        |
| -------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `toolchain.md` | uv, Ruff, pyright: config ownership, rule floor, house verbs, the pin | When setting up or changing dependency/lint/format/type tooling, or wiring editor/CI checks |

The annotation convention for deliberate deviations, footguns, and to-dos is not language-level — it binds every project: [`conventions/code-annotations.md`](../../../conventions/code-annotations.md).

## Typing

Type hints on every function signature, parameters and return alike — an unannotated function is invisible to the type checker, so the checker's guarantee is only as wide as the annotations. Type comments and stub-only annotations for code the project itself owns are not an alternative.
