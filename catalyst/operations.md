# Operations Runbook

How to run what decision 004 adopted — one section per stateful component, three parts each: **Operate** (paste-ready commands), **Recovery** (the drill, with the date it was last actually performed), **Quirks** (traps that already bit someone). Rules and contracts live in `architecture.md` and the feature documents, never here.

Status note: the API and its Neon database are built and running locally (`decisions/005_bootstrap_api.md`); the nightly backup workflow is not, and nothing is deployed yet. Decision 007 chose the hosting and staged it — neither Vercel project exists until someone creates it. A recovery drill marked _never_ is a debt that comes due before the first real user's data lands.

## Vercel hosting

Two projects from this one repository, both with the repository root as their Root Directory: **`z-team-planner`** (Nuxt preset) and **`z-team-planner-api`** (FastAPI preset, region `fra1`, install command `uv sync --locked`). Production branch is `master`; preview deployments are off. Decision 007 holds the why and the staging — the API project is not created until its gate passes.

### Operate

```bash
vercel link                                 # bind this checkout to one project (once per project)
vercel --prod                               # deploy the linked project to production
vercel promote <deployment-url>             # make an earlier deployment production again
vercel env ls production                    # what the next build will read
vercel logs <deployment-url>                # runtime logs for one deployment
```

A push to `master` deploys whichever projects exist. Everything else is dashboard work: creating a project, its region, and its environment variables.

### Recovery

Rolling back is `vercel promote` against an earlier deployment (Instant Rollback in the dashboard) — it reassigns the production domain immediately, with no rebuild. There is nothing here to restore: the frontend is a build artifact and the API holds no data of its own. Data recovery is the Neon section's drill.

### Quirks

- **A `NUXT_PUBLIC_*` change needs a redeploy, not an environment edit.** `/` is prerendered, so those values are baked into the payload at build time. Editing the variable in the dashboard changes nothing until the next build.
- An **empty `NUXT_PUBLIC_API_BASE_URL` is a valid deployment**, not a broken one: it means no API is behind this frontend and sign-in is unavailable (feature 006). The missing Firebase variables still fail the build, loudly, in `build:before`.
- **`vercel.json` is read from a project's Root Directory.** Both projects are rooted at the repository root, so any such file would be read by both — and a `functions` glob that matches no files hard-fails the build it does not belong to. Python configuration lives in `pyproject.toml` instead, where the Nuxt project cannot see it.
- **The API project must stay in `fra1`.** Vercel's default is `iad1`, which puts an ocean between every query and Neon in `eu-central-1`.
- **Alembic never runs on Vercel.** Migrations are manual, from a workstation, against the direct endpoint — the Neon section's commands.
- Vercel's **Neon marketplace integration is not used**: it injects a single `DATABASE_URL`, and this project needs the pooled and direct endpoints separately. Both variables are set by hand.

## API service

FastAPI in `app/`, run with uv. Stateless: it holds no data of its own, so everything below is about starting it and reading what it says. Structure and invariants are `app/CLAUDE.md`.

### Operate

```bash
uv sync --locked                                        # install exactly the lockfile
uv run uvicorn app.main:create_app --factory --reload --port 8000   # development
curl -sS localhost:8000/healthz                         # liveness: {"status":"ok"}
curl -sS -i localhost:8000/readyz                       # readiness: 200 ready / 503 not_ready
curl -sS -i localhost:8000/healthz | grep -i x-request-id   # the id every response carries
uv run pytest                                           # -m "not integration" without Docker
uv run python -m scripts.reset_db --yes                 # drop + migrate, development only
METRICS_ENABLED=true uv run uvicorn app.main:create_app --factory   # then GET /metrics
```

Grepping one request across the logs: every line carries `[req <id>]`, and the id is either the caller's `X-Request-ID` or one generated at the edge.

### Recovery

The API is stateless — recovery is "start it again". The data drill is the Neon section's; there is nothing here to restore. A process that will not start is almost always configuration: `Settings` validates at startup and refuses rather than serving degraded, so read the first line of the traceback.

### Quirks

- `/readyz` answers **503 while a suspended Neon compute wakes**, and the first request after idle takes ~1.1s (measured). A readiness timeout shorter than that marks the API dead every time it has been idle.
- `/healthz` deliberately does not touch the database. Pointing a liveness probe at `/readyz` would restart the process every time Neon suspends.
- There is **no module-level `app`** — uvicorn needs `app.main:create_app --factory`. `uvicorn app.main:app` fails with an attribute error.
- `/metrics` is absent (404) unless `METRICS_ENABLED=true`, and must never be publicly routable. Single-process only: under `--workers N` each worker keeps its own registry and the numbers silently under-report.
- The `/shared/*` rate limit is **inert in production**: it is an in-process token bucket, 60 a minute per caller, and every serverless instance holds its own — so the ceiling is 60 × however many instances Vercel happens to be running, and it keys on the socket peer, which behind a proxy is the proxy. Decision 007 named the edge and found there is none to be had on this plan, so `/shared/*` is effectively unprotected; the code stays as feature 007's stopgap. The danger is not the missing ceiling on a hobby app with unguessable ids — it is reading this code and believing the ceiling works.
- `uvicorn --reload` is development only.
- `FIREBASE_AUTH_EMULATOR_HOST` set while `APP_ENV` is not `development` stops the process at startup. That is the guard working, not a bug.

## Neon Postgres

One Neon project, one long-lived `dev` branch besides `main`, CI branches created on demand with an expiry. Application traffic uses the **pooled** endpoint; migrations and anything session-scoped use the **direct** one.

### Operate

```bash
neon branches list                                      # branches, their computes, expiry
neon connection-string --branch dev                     # direct endpoint (migrations)
neon connection-string --branch dev --pooled            # pooled endpoint (the API)
uv run alembic current                                  # applied revision (env.py reads DATABASE_URL_DIRECT itself)
uv run alembic upgrade head                             # apply migrations — direct endpoint only
neon branches create --name ci-<sha> --expires-at <rfc3339>   # throwaway CI branch, ≤30 days
```

### Recovery

Two tiers. Neon's own instant restore covers the last **6 hours** on the Free plan (Launch: up to 7 days) — enough for "undo the last bad migration", not for losing the project. The nightly dump (next section) is the real backup.

Restore from a dump, on a scratch branch first:

```bash
neon branches create --name restore-test
gpg --decrypt ztp-<date>.sql.gz.gpg | gunzip | psql "$(neon connection-string --branch restore-test)"
psql "$(neon connection-string --branch restore-test)" -c 'select count(*) from users; select count(*) from builds;'
```

Compare counts with the dump's manifest, then either promote the branch or repeat against `main`. Rehearsed: **never** — first rehearsal due before the first real user, then after every material schema change.

### Quirks

- The pooled endpoint is PgBouncer in transaction mode: `SET`, `LISTEN/NOTIFY`, temp tables and session-level advisory locks are unsupported, and **advisory locks fail silently**. Alembic must never see the pooled URL.
- Free-plan computes suspend after 5 minutes idle and this cannot be disabled. A pool that held a socket across the suspend gets `SSL SYSCALL error: EOF detected`; the engine runs `pool_pre_ping=True`, `pool_recycle=240` (not 300 — that races the boundary) and `connect_timeout=10`.
- Always spell the driver: `postgresql+psycopg://`. A bare `postgresql://` means psycopg2 on SQLAlchemy 2.0 and psycopg 3 on 2.1 — the driver would swap on a routine bump.
- Free-plan ceilings: 0.5 GB storage, 10 branches, 100 CU-hours per month. Expired CI branches free their slot; a forgotten `restore-test` branch does not.

## Nightly backup (GitHub Actions → Cloudflare R2)

A scheduled workflow runs `pg_dump` against the direct endpoint, encrypts with a repository-secret GPG key, and uploads to a private R2 bucket. Nothing is ever attached as a workflow artifact — this repository is public and artifacts are downloadable by anyone.

### Operate

```bash
gh workflow run backup.yml                              # trigger out of schedule
gh run list --workflow backup.yml --limit 5             # last runs
wrangler r2 object list ztp-backups --prefix ztp-       # what is in the bucket
wrangler r2 object get ztp-backups/ztp-<date>.sql.gz.gpg --file ztp-<date>.sql.gz.gpg
```

### Recovery

The restore drill is the Neon section's. The decryption key's private half lives outside the repository and outside GitHub — losing it makes every dump unreadable. Key location and the drill date are recorded here when the workflow lands.

### Quirks

- A dump holds user emails: personal data. Retention follows the accounts feature document; the workflow prunes dumps older than that window on every run, so the bucket never becomes a shadow copy with its own retention.
- R2's free tier is far beyond two small tables; the thing that grows is the number of dumps, not their size. Pruning is what keeps it free.

## Firebase Authentication

Spark plan, Google sign-in only. Firebase holds identities; the app's own `users` table holds the Firebase uid **and** the Google subject so the table stays portable.

### Operate

The API needs two variables: `FIREBASE_PROJECT_ID` (the issuer and audience every token is checked against) and `FIREBASE_SERVICE_ACCOUNT_FILE` (the key, kept outside this public repository). In development the emulator replaces the key — set `FIREBASE_AUTH_EMULATOR_HOST` instead, and the SDK stops checking signatures.

```bash
firebase auth:export users.json --format=json           # full user list, round-trippable
firebase auth:import users.json --hash-algo=...         # import (hash options per the Firebase docs)
firebase emulators:start --only auth                    # local emulator on port 9099
```

### Recovery

Firebase is a vendor: there is no restore, only export. The documented `auth:export` / `auth:import` round-trip is the exit path, together with the stored Google subject. Exercised: **never** — first export due with the first real user, then quarterly.

### Quirks

- `FIREBASE_AUTH_EMULATOR_HOST` set outside development is a **total auth bypass** — emulator tokens are unsigned. The API refuses to start with it set unless the environment is explicitly development.
- **The emulator needs `--project`, and it must match `FIREBASE_PROJECT_ID`.** `firebase emulators:start --only auth` on its own mints tokens for `demo-no-project`, and the API refuses every one of them with a `401` — it checks the audience, so the failure looks like a broken sign-in rather than a misconfigured emulator.
- The token's `sub` is the Firebase uid, not the Google account id. The Google subject is in `firebase.identities`; copy it at first sign-in, never rely on reading it later.
- Do not upgrade the project to Identity Platform: it caps social sign-in at 3,000 DAU/day where plain Firebase Auth has no cap, and the upgrade has no documented downgrade path.
- Unverified Google-only apps show `<project-id>.firebaseapp.com` on the consent screen, not the app name. Harmless, but users will ask.
