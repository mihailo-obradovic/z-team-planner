# Decision: Bootstrap the FastAPI service

## Status

Implemented

## Type

bootstrap

## Task Weight

Medium

## Context

Decision 004 adopted FastAPI, Neon Postgres and Firebase identity, and moved the Nuxt app to `web/` to free the root `app/`, but built nothing: no `pyproject.toml`, no lockfile, no interpreter pin, no migrations, no test harness. Features 004 and 005 cannot start against an empty directory. This record is the scaffold, and it carries no product behavior.

## Decision

uv, Ruff and pyright on Python 3.14, with `pyproject.toml` as the single config home. One `Settings` class (pydantic-settings) resolved eagerly in the app factory, so a missing variable stops the process rather than surfacing as a 500; it carries the Firebase-emulator refusal feature 004 requires.

A synchronous engine with Neon's `pool_pre_ping`, `pool_recycle=240` and `connect_timeout=10`; `get_db` yields a session and never commits, so transaction boundaries stay in services.

Two things land early on purpose. The shared log line format, with an `X-Request-ID` contextvar accepted-or-generated at the edge and echoed on every response — including from the 500 handler, which Starlette runs outside the middleware stack and which would otherwise answer without it. And feature 005's error envelope in full: the code vocabulary, and `details` paths on `422` only. Neither feature then invents its own shape.

`/healthz` and `/readyz` mount at the root, outside `/api/v1` and therefore outside the auth seam features 004 and 005 add. `/metrics` ships behind `METRICS_ENABLED`, default off. Alembic reads `DATABASE_URL_DIRECT`.

## Scope

`app/` (`core`, `middleware`, `exceptions`, `routes`, and a `models` package holding only the declarative base), `alembic/`, `tests/`, `scripts/reset_db.py`, `pyproject.toml`, `.python-version`, `uv.lock`, `.env.example`, `.editorconfig`, `.gitignore`, `app/CLAUDE.md`, `README.md`, `operations.md`, `.github/workflows/ci.yml`, and `architecture.md` for the dependency rows.

Untouched: `web/`, and every behavior contract. Not created: the `users` and `builds` tables and the seed script (feature 004's, since the rules for what may enter a non-production database arrive with its personal-data declaration), and a `Dockerfile` (Deployment is declined).

## Consequences

A second language and toolchain in one repository, and a second CI job. Three packages sit outside the adopted modules' Approved Libraries and are approved here, recorded in `architecture.md` in the same change: `uvicorn[standard]` (FastAPI ships no server), `pydantic-settings` (Pydantic v2 moved `BaseSettings` into its own distribution), and `httpx` (Starlette's `TestClient` is a wrapper over it). `psycopg` needs no approval — the persistence module's pairing table already names it.

`requires-python = ">=3.14"` also sets Ruff's `target-version`, so `UP` rewrites to syntax older interpreters reject. Testcontainers needs a Docker daemon; without one the database tests skip loudly rather than fall back to a SQLite lookalike.

Metrics ship with the mechanism but no destination — the numbers go nowhere until a scrape target exists.

## Contracts Touched

- `project-summary.md` — an ADR index row; no feature row.
- `architecture.md` — the three approved dependencies.
- `operations.md` — a new API service section.
- `app/CLAUDE.md` — new folder document.

## Open Questions

## Verification

The four verbs exit 0, `pyright` at 0 errors, `pytest` green with unit tests plus integration tests against a real PostgreSQL 17 via testcontainers. Against the running API: `/healthz` and `/readyz` answer `200` on the real Neon `dev` branch, an unknown route answers `404` in the envelope, and every response carries the `X-Request-ID` the access line logs. `alembic upgrade head` succeeds on the direct endpoint. Two guards were proven by firing them: the emulator variable with `APP_ENV=staging` aborts startup, and `/readyz` answers `503` against a dead database while `/healthz` still answers `200`.
