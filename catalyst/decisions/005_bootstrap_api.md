# Decision: Bootstrap the FastAPI service

## Status

Proposed

## Type

bootstrap

## Task Weight

Medium

## Context

Decision 004 adopted FastAPI, Neon Postgres and Firebase identity, and moved the Nuxt app to `web/` to free the root `app/`. Nothing was built: there is no `pyproject.toml`, no lockfile, no interpreter pin, no migrations, no test harness — that record's own Verification reads "nothing runs yet". Features 004 and 005 are `Approved` and cannot start against an empty directory. This record is the scaffold, and it carries no product behavior.

## Decision

uv, Ruff and pyright on Python 3.14, with `pyproject.toml` as the single config home. One `Settings` class (pydantic-settings) resolved eagerly in the app factory, so a missing variable stops the process rather than surfacing as a 500; it carries the Firebase-emulator refusal feature 004 requires.

A synchronous engine with Neon's `pool_pre_ping`, `pool_recycle=240` and `connect_timeout=10`; `get_db` yields a session and never commits, so transaction boundaries stay in services.

Two things land early on purpose. The shared log line format, with an `X-Request-ID` contextvar accepted-or-generated at the edge and echoed on every response — including from the 500 handler, which Starlette runs outside the middleware stack and which would otherwise answer without it. And feature 005's error envelope in full: the code vocabulary, and `details` paths on `422` only. Neither feature then invents its own shape.

`/healthz` and `/readyz` mount at the root, outside `/api/v1` and therefore outside the auth seam features 004 and 005 add. `/metrics` ships behind `METRICS_ENABLED`, default off. Alembic reads `DATABASE_URL_DIRECT` and starts with zero revisions.

## Scope

`app/` (`core`, `middleware`, `exceptions`, `routes`, and a `models` package holding only the declarative base), `alembic/`, `tests/`, `scripts/reset_db.py`, `pyproject.toml`, `.python-version`, `uv.lock`, `.env.example`, `.editorconfig`, `.gitignore`, `app/CLAUDE.md`, `README.md`, `operations.md`, `.github/workflows/ci.yml`, and `architecture.md` for the dependency rows.

Untouched: `web/`, and every behavior contract. Not created: `shared/` (feature 005 — it needs an export script that does not exist yet), a `Dockerfile` (Deployment is declined and no host is chosen), the `users` and `builds` tables, and the seed script.

## Consequences

A second language and toolchain in one repository, and a second CI job. Three packages sit outside the adopted modules' Approved Libraries and are approved here, recorded in `architecture.md` in the same change: `uvicorn[standard]` (FastAPI ships no server), `pydantic-settings` (Pydantic v2 moved `BaseSettings` into its own distribution), and `httpx` (Starlette's `TestClient` is a wrapper over it). `psycopg` needs no approval — the persistence module's pairing table already names it.

`requires-python = ">=3.14"` also sets Ruff's `target-version`, so `UP` rewrites code to syntax older interpreters reject. Testcontainers needs a Docker daemon: present locally and on `ubuntu-latest`; where it is absent the database tests skip loudly rather than fall back to a SQLite lookalike.

Metrics ship with the mechanism but no destination — the numbers go nowhere until a host and a scrape target exist. The bootstrap flow's seed script is deliberately deferred to feature 004: there are no tables yet, and the rules governing what may enter a non-production database arrive with that feature's personal-data declaration. A Dockerfile arrives with the hosting decision, not before.

## Contracts Touched

- `project-summary.md` — an ADR index row; no feature row.
- `architecture.md` — the three approved dependencies.
- `operations.md` — a new API service section, and the Neon section's "adopted but not yet built" note corrected.
- `app/CLAUDE.md` — new folder document.

## Open Questions

## Verification

Pending.
