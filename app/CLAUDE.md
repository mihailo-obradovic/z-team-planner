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
- `models/` — `base.py` holds the declarative `Base`; the package `__init__` imports every model, which is what Alembic's autogenerate diffs against. `users` landed with feature 005 (its owner is feature 004); `builds` follows in the same feature.
- `schemas/` — Pydantic DTOs. `builds.py` holds `BuildDocument` (the structural half of a saved build), the request and response shapes, and `render_timestamp` — the one rendering used for both a body's `updated_at` and the `ETag` header, so a client can hand back exactly what it was given.
- `repositories/` — database operations only, one module per table: `users.py`, `builds.py`, `idempotency.py`.
- `services/` — business logic and transaction boundaries: `validation.py` (the five tiers), `users.py` (resolving a token to an account row).
- `auth/` — `get_current_user` and `CurrentUserDep`, the one seam every user-scoped route names; `core/firebase.py` initialises the SDK it calls.
- `core/game_data.py` — the generated game-data fixture, read once.

Migrations are `alembic/` at the repo root; tests are `tests/`; the development reset is `scripts/reset_db.py`. The two fixtures the server validates against are `shared/`, generated from `web/` by `pnpm run game-data:export`.

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
- **`builds.format_version` is a generated column.** It is `GENERATED ALWAYS AS ((data ->> 'v'))::integer STORED`, so no statement can set it to something the document does not say. Do not add it to an INSERT.
- **Name uniqueness and the deletion cascade are the schema's.** `uq_builds_owner_name` settles two concurrent creates that both found a name free, and `ON DELETE CASCADE` is what makes feature 004's total deletion true.
- **Game data is never hand-copied here.** `shared/game-data.json` is generated from `web/types/hero.ts`; a frontend test fails if the committed fixture drifts. Change the hero data in `web/`, re-export, and commit both.
- **`verify_id_token` failures split three ways.** A bad or expired token is `401`; certificates the SDK cannot fetch are `503`, because the token may be fine and a `401` would sign every user out over a Google outage.
- Integration tests run against a real PostgreSQL through testcontainers, never a SQLite stand-in; without Docker they skip loudly. A test needing tables takes the `migrated_db` fixture, which migrates and truncates.
