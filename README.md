# Z-Team Planner

A build calculator for [Dispatch](https://store.steampowered.com/app/2429620/Dispatch/) (AdHoc Studio). Plan your Z-Team ahead of time: level heroes, train powers and flight, pick synergy pairs, and mirror your story choices (who was cut in episode 3, who was hired in episode 4). Builds persist in your browser and are shareable as URLs — no account needed.

Built with Nuxt 4, Nuxt UI 4, and Tailwind CSS 4. Builds live in the browser and share by URL; signing in with Google saves them to a FastAPI backend on Neon Postgres instead (Catalyst decision 004).

## Running it from a fresh clone

The repository holds two applications: a Nuxt front end in `web/` and a FastAPI back end in `app/`. **You only need the back end if you want signed-in accounts.** Anonymous planning — the whole calculator, local saves, `?build=` share links — runs on the front end alone, with no database, no Firebase project and no `.env` at all.

### Prerequisites

| Tool                                                     | Why                               | Notes                                                                                            |
| -------------------------------------------------------- | --------------------------------- | ------------------------------------------------------------------------------------------------ |
| **Node ≥ 24**                                            | the front end                     | `.nvmrc` pins `v24`; `nvm use` picks it up                                                       |
| **pnpm 10**                                              | the only package manager accepted | `corepack enable` uses the version in `packageManager`; a `preinstall` hook rejects npm and yarn |
| **[uv](https://docs.astral.sh/uv/)**                     | the back end                      | it installs Python 3.14 itself from `.python-version` — no separate Python needed                |
| **Docker**                                               | back-end integration tests        | optional; without it those tests skip loudly rather than fall back to a fake database            |
| **[Firebase CLI](https://firebase.google.com/docs/cli)** | signing in locally                | optional; only for the Auth emulator                                                             |

### Front end only

```bash
pnpm install
pnpm dev            # http://localhost:3000
```

That is genuinely all of it. Sign-in reports itself unavailable and every account query stays switched off, which is the designed behaviour rather than an error state.

### With the back end

Both applications read the same `.env` at the repository root — Nuxt for its `NUXT_PUBLIC_*` values, FastAPI for the rest.

```bash
cp .env.example .env
```

Fill in:

- **`DATABASE_URL` and `DATABASE_URL_DIRECT`.** From [Neon](https://neon.tech) (`neon connection-string dev --pooled` and `neon connection-string dev`), or from any local PostgreSQL — point both at it. **They are not interchangeable:** the pooled endpoint is PgBouncer in transaction mode, where the advisory locks Alembic takes fail _silently_, so migrations must only ever see the direct one. Spell the driver: `postgresql+psycopg://`, never a bare `postgresql://`.
- **`FIREBASE_PROJECT_ID`**, plus either `FIREBASE_SERVICE_ACCOUNT_FILE` (a service-account key, kept outside this repository — it is public) or `FIREBASE_AUTH_EMULATOR_HOST` for local work. The API refuses to start with neither, and refuses to start with the emulator variable set outside development, because emulator tokens are unsigned.
- **`CORS_ALLOW_ORIGINS`** must list `http://localhost:3000`. It is deny-by-default: an empty list admits no browser at all.
- **`NUXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1`**, and the four `NUXT_PUBLIC_FIREBASE_*` values from `firebase apps:sdkconfig` (public — they ship in the browser bundle).

Then install, migrate, and run the three processes in their own terminals:

```bash
pnpm install
uv sync --locked
uv run alembic upgrade head                                          # direct endpoint only
```

```bash
firebase emulators:start --only auth                                 # :9099, for signing in
uv run uvicorn app.main:create_app --factory --reload --port 8000    # the API
pnpm dev                                                             # the app, :3000
```

To sign in against the emulator rather than a real Google account, also set `NUXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST=localhost:9099`; the web SDK then talks to it instead of Google, and the API accepts the tokens it mints.

Check the API is alive with `curl localhost:8000/healthz` and that it can reach the database with `curl localhost:8000/readyz`. A suspended Neon compute makes the first `/readyz` take about a second while it wakes — that is normal, not a fault.

> `uvicorn app.main:create_app --factory` is not optional. There is no module-level `app` object, deliberately: importing one would read the environment and reconfigure logging as a side effect.

### Everyday commands

```bash
pnpm lint        # oxlint            uv run ruff check .
pnpm format      # oxfmt             uv run ruff format .
pnpm typecheck   # vue-tsc via nuxt  uv run pyright
pnpm test        # vitest            uv run pytest
```

`uv run pytest -m "not integration"` skips the tests that need Docker. `pnpm run game-data:export` regenerates `shared/game-data.json` from `web/types/hero.ts` — the fixture the API validates saved builds against; a test fails if the committed copy has drifted.

`app/CLAUDE.md` is the orientation map for the service, and `web/CLAUDE.md` for the app.

### VS Code / Cursor

Open the repository root, not either sub-directory. On first open the editor offers the recommended extensions from `.vscode/extensions.json` — accept them: oxc provides lint and format for TypeScript, Vue, CSS and JSON (`.vscode/settings.json` already sets it as the formatter and turns on format-on-save), Volar handles Vue SFCs, and Better Comments colours the `// *` and `// !` annotation markers this codebase uses throughout.

For the Python side, add **ms-python.python** and **charliermarsh.ruff** yourself — they are not in the recommendation list, which Catalyst generates and which currently ships no Python entries. Point the interpreter at `.venv/bin/python`, which `uv sync` creates.

## Production

Build and locally preview:

```bash
pnpm build
pnpm preview
```

Unlike `pnpm dev`, a production build **fails** unless `NUXT_PUBLIC_API_BASE_URL` and the four `NUXT_PUBLIC_FIREBASE_*` values are set — they are baked into the bundle, and a build with none of them would ship an app silently pointed at nothing. Development is deliberately exempt so the anonymous planner needs no setup at all.

See the [Nuxt deployment documentation](https://nuxt.com/docs/getting-started/deployment) for hosting options. Nothing is deployed yet, and no host has been chosen for the API.

## The catalyst/ Directory

`catalyst/` is this repository's Catalyst rule set — the documents an agent reads before it changes anything here, adopted into this repository from the Catalyst template. They are contracts, not descriptions: `catalyst/prime-directive.md` says how work runs (task weights, the feature and decision gates, branch and commit discipline), `catalyst/architecture.md` says what this system may be built from, and `catalyst/project-summary.md` indexes this project's own features and decisions. Start at `catalyst/AGENTS.md` — it is the file index, and everything else loads on demand.

The project's own documents are written inside the bundle (`catalyst/features/`, `catalyst/decisions/`), never in root-level directories. The rule set is upgraded in place from the Catalyst repository, so `catalyst/` is edited deliberately and never reorganized.
