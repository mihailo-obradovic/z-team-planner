# app/ — FastAPI application

The backend of the Z-Team build calculator: a FastAPI (Python 3.14) service on Neon Postgres, reached through synchronous SQLAlchemy and psycopg 3. It lives at the root `app/` because the Nuxt app moved to `web/` to free the slot (decision 004). Scaffolded by [decision 005](../catalyst/decisions/005_bootstrap_api.md). A folder-scoped document is an orientation map (what lives where + pointers into `catalyst/`), never global rules or feature contracts.

Paths below are relative to the repo root. The `catalyst/` documents are normative for how this code is written; this file only says what lives where.

The backend owns exactly two things — **accounts** and **account builds**. Game data stays in the frontend, because it feeds the compile-time type system; the server mirrors only the constants needed to validate a saved build (decision 004).

## Structure

- `main.py` — `create_app()`, and the wiring order that matters: settings → logging → app → exception handlers → middleware → ops routes → the `/api/v1` router feature routers mount onto.
- `core/config.py` — the one `Settings` class; every environment variable, validated at startup. Holds the Firebase-emulator refusal.
- `core/database.py` — the engine (Neon pool settings), the session factory, `get_db`, and the `DbSession` annotated dependency.
- `core/logging.py` — `CatalystFormatter` and `request_id_var`, the contextvar the whole request-tracing chain hangs off.
- `middleware/` — request id, the access line, the body limit, metrics. CORS is Starlette's own, configured in `main.py`.
- `exceptions/` — `errors.py` holds the envelope and the `ErrorCode` vocabulary; `handlers.py` registers the four central handlers.
- `routes/` — `health.py` (`/healthz`, `/readyz`) and `metrics.py`. Transport only, no business logic.
- `models/` — the declarative `Base` and nothing else yet; `users` arrives with feature 004, `builds` with feature 005.
- `schemas/`, `repositories/`, `services/`, `auth/` — not yet created. They arrive in the stack module's scaffold order as features need them.

Migrations are `alembic/` at the repo root; tests are `tests/`; the development reset is `scripts/reset_db.py`.

## Entry points and verbs

```bash
uv sync --locked
uv run uvicorn app.main:create_app --factory --reload --port 8000
uv run pytest                      # -m "not integration" to skip the ones needing Docker
uv run ruff check .                # lint:fix / format / format:check per the toolchain doc
uv run pyright
uv run alembic upgrade head        # direct endpoint only
uv run python -m scripts.reset_db --yes
```

There is no module-level `app` object — importing `main` would then read the environment and reconfigure logging as a side effect, so uvicorn is given the factory instead.

## Governing documents

- Structure, layering, tool bindings → `catalyst/stacks/backend/python-fastapi.md`
- uv, Ruff, pyright, the verbs → `catalyst/stacks/_lang/python/toolchain.md`
- Type hints on every signature → `catalyst/stacks/_lang/python/python.md`
- The database engine → `catalyst/stacks/database/postgres.md`
- Sync sessions, psycopg 3, the explicit dialect → `catalyst/decisions/004_infra_backend-adoption.md`
- This scaffold and its deferrals → `catalyst/decisions/005_bootstrap_api.md`
- Neon quirks, run and recovery commands → `catalyst/operations.md`
- Comment markers (`# *`, `# !`) → `catalyst/conventions/code-annotations.md`
- The API's behavior contracts → `catalyst/features/004_accounts.md`, `catalyst/features/005_account-builds.md`

## Local invariants

- **Two database URLs, never interchangeable.** `DATABASE_URL` is the pooled endpoint and serves requests; `DATABASE_URL_DIRECT` is the direct one and is the only thing Alembic or DDL may touch. Alembic against the pooled endpoint loses its advisory lock silently.
- **`get_db` never commits.** Transaction boundaries live in the service layer; the FastAPI tutorial's version commits, and that is not this.
- **Ops routes stay off `/api/v1`.** Features 004 and 005 add an auth dependency to the versioned router, and health and metrics must never sit on the user-traffic auth seam.
- **The error envelope is `exceptions/errors.py`.** A feature adds a code to `ErrorCode`; it never invents a second response shape. `details` appears on `422` only, and `X-Request-ID` is on every response — the handlers set it themselves, because the 500 handler runs outside the middleware stack.
- **The emulator guard is in `core/config.py`.** `FIREBASE_AUTH_EMULATOR_HOST` outside development stops the process: emulator tokens are unsigned, so serving with it set is a total auth bypass.
- **Metric labels use the route template**, never the raw path — build ids must never become labels.
- Integration tests run against a real PostgreSQL through testcontainers, never a SQLite stand-in; without Docker they skip loudly.
