# Z-Team Planner

A fan-made build calculator for the game [Dispatch](https://store.steampowered.com/app/2429620/Dispatch/) by AdHoc Studio. Plan your Z-Team ahead of time: level heroes, train powers and flight, and mirror your story choices (who was cut in episode 3, who was hired in episode 4), which decide your synergy pairs. Builds persist in your browser and are shareable as URLs — no account needed.

Built with Nuxt 4, Nuxt UI 4, and Tailwind CSS 4. Builds live in the browser and share by URL; signing in with Google saves them to a FastAPI backend on Neon Postgres instead.

## Running it from a fresh clone

The repository holds two applications: a Nuxt front end in `web/` and a FastAPI back end in `app/`. **You only need the back end if you want signed-in accounts.** Anonymous planning — the whole calculator, local saves, `?build=` share links — runs on the front end alone, with no database, no Firebase project and no `.env` at all.

### Prerequisites

| Tool                                                     | Why                               | Notes                                                                                            |
| -------------------------------------------------------- | --------------------------------- | ------------------------------------------------------------------------------------------------ |
| **Node ≥ 24**                                            | the front end                     | `mise.toml` pins Node 24; `mise install` picks it up                                             |
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
- **`FIREBASE_PROJECT_ID`**, plus either `FIREBASE_SERVICE_ACCOUNT_FILE` (a service-account key, kept outside this repository — it is public) or `FIREBASE_AUTH_EMULATOR_HOST` for local work. A deployed host has no file to point at, so it sets `FIREBASE_SERVICE_ACCOUNT_JSON` to the key's contents instead; the file and the JSON are mutually exclusive. The API refuses to start with no credential and no emulator, and refuses to start with the emulator variable set outside development, because emulator tokens are unsigned.
- **`CORS_ALLOW_ORIGINS`** must list `http://localhost:3000`. It is deny-by-default: an empty list admits no browser at all.
- **`NUXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1`**, and the four `NUXT_PUBLIC_FIREBASE_*` values from `firebase apps:sdkconfig` (public — they ship in the browser bundle).

Then install, migrate, and run the three processes in their own terminals:

```bash
pnpm install
uv sync --locked
uv run alembic upgrade head                                          # direct endpoint only
```

```bash
firebase emulators:start --only auth --project z-team-planner        # :9099, for signing in
uv run uvicorn app.main:create_app --factory --reload --port 8000    # the API
pnpm dev                                                             # the app, :3000
```

To sign in against the emulator rather than a real Google account, also set `NUXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST=localhost:9099`; the web SDK then talks to it instead of Google, and the API accepts the tokens it mints.

`--project` is not optional, and it must match `FIREBASE_PROJECT_ID`. Without it the emulator mints tokens for `demo-no-project`, and the API refuses every one of them with a `401` — it checks the audience, so a token for another project never passes.

Check the API is alive with `curl localhost:8000/healthz` and that it can reach the database with `curl localhost:8000/readyz`. A suspended Neon compute makes the first `/readyz` take about a second while it wakes — that is normal, not a fault.

> `uvicorn app.main:create_app --factory` is not optional. There is no module-level `app` object, deliberately: importing one would read the environment and reconfigure logging as a side effect.

### Everyday commands

```bash
pnpm lint        # oxlint            uv run ruff check .
pnpm format      # oxfmt             uv run ruff format .
pnpm typecheck   # vue-tsc via nuxt  uv run pyright
pnpm test        # vitest            uv run pytest
```

```bash
pnpm lint:fix        # oxlint with its safe fixes applied
pnpm format:check    # oxfmt without writing — what CI runs
pnpm test:unit       # plain Node unit tests only (test/unit/)
pnpm test:nuxt       # Nuxt runtime tests only (test/nuxt/)
pnpm test:watch      # vitest in watch mode; every other test script runs once
pnpm test:coverage   # the whole suite with a V8 coverage report in coverage/
```

CI (`.github/workflows/ci.yml`) runs lint, format check, typecheck and tests for both applications on every push and pull request, Renovate opens dependency PRs on Mondays, and security fixes as soon as an advisory lands; none of them merges without a person.

### The pre-commit hook

Optional, and per clone. It runs the Catalyst document validator and then `oxfmt --check`, blocking the commit if either objects:

```bash
git config core.hooksPath .githooks    # activate
git config --unset core.hooksPath      # undo
```

Worth the two seconds because the failure it catches is invisible locally: `oxfmt` reflows Markdown tables, so a hand-edited document passes the validator and fails CI. `core.hooksPath` replaces `.git/hooks` wholesale, so `.githooks/pre-commit` calls the Catalyst hook itself rather than letting the symlink there do it.

`uv run pytest -m "not integration"` skips the tests that need Docker. `uv run python -m scripts.reset_db --yes` drops the development database schema and migrates it back up; it refuses unless `APP_ENV` is `development`. `pnpm run game-data:export` regenerates `shared/game-data.json` from `web/types/hero.ts` — the fixture the API validates saved builds against; a test fails if the committed copy has drifted.

`app/CLAUDE.md` is the orientation map for the service, and `web/CLAUDE.md` for the app.

### VS Code / Cursor

Open the repository root, not either sub-directory. On first open the editor offers the recommended extensions from `.vscode/extensions.json` — accept them: oxc provides lint and format for TypeScript, Vue, CSS and JSON (`.vscode/settings.json` already sets it as the formatter and turns on format-on-save), Volar handles Vue SFCs, and Better Comments colours the `// *` and `// !` annotation markers this codebase uses throughout.

The Python side is in the same list: the Python extension and its debugger, Ruff as formatter (`settings.json` makes it the Python formatter and organises imports on save), and Pyright for the editor — **anysphere.cursorpyright** on Cursor, **ms-python.vscode-pylance** on VS Code; each editor reports the other as not found, so install the one yours can. mise (**hverlin.mise-vscode**) picks up the Node pin from `mise.toml`. `settings.json` points the interpreter at `.venv/bin/python`, which `uv sync` creates.

## Production

Build and locally preview:

```bash
pnpm build
pnpm preview
```

Unlike `pnpm dev`, a production build **fails** unless the four `NUXT_PUBLIC_FIREBASE_*` values, `NUXT_SITE_URL` (the absolute origin, no trailing slash) and `NUXT_SITE_ENV` are set — they are baked into the bundle, and a build with none of them would ship an app silently pointed at nothing. `NUXT_SITE_ENV` must be `production` for search engines to index the site; any other value keeps every page out. `NUXT_PUBLIC_API_BASE_URL` is the one exception: left empty, the build succeeds as the planner alone, with sign-in unavailable. Development is deliberately exempt so the anonymous planner needs no setup at all.

The planner is live on Vercel at <https://z-team-planner.vercel.app>, deployed from `master` — the frontend alone, with sign-in unavailable. The API is not deployed yet: it goes to a second Vercel project once nightly backups exist and a restore has been rehearsed. `catalyst/operations.md` is the runbook.

## The catalyst/ Directory

`catalyst/` is this repository's Catalyst rule set — the documents an agent reads before it changes anything here, adopted into this repository from the Catalyst template. They are contracts, not descriptions: `catalyst/prime-directive.md` says how work runs (task weights, the feature and decision gates, branch and commit discipline), `catalyst/architecture.md` says what this system may be built from, and `catalyst/project-summary.md` indexes this project's own features and decisions. Start at `catalyst/AGENTS.md` — it is the file index, and everything else loads on demand.

The project's own documents are written inside the bundle (`catalyst/features/`, `catalyst/decisions/`), never in root-level directories. The rule set is upgraded in place from the Catalyst repository, so `catalyst/` is edited deliberately and never reorganized.
