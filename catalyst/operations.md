# Operations Runbook

How to run what decision 004 adopted — one section per stateful component, three parts each: **Operate** (paste-ready commands), **Recovery** (the drill, with the date it was last actually performed), **Quirks** (traps that already bit someone). Rules and contracts live in `architecture.md` and the feature documents, never here.

Status note: **stage 2 is live** (21 September 2026). The planner is at <https://z-team-planner.vercel.app>, with Google sign-in enabled. Since decision 012 the API answers on the same origin under `/api/v1`. Decision 007's four gates all passed first: the scheduled backup workflow runs, its restore has been rehearsed, Firebase has the live domain authorized with a published consent screen, and the privacy page is reachable. Neon `main` is production at revision `182ad318ac94`. A real Google sign-in was completed on the live site the same day.

## Vercel hosting

One project, **`z-team-planner`** (team `obradovic-co`), holding two services that the root `vercel.json` declares: `web` (Nuxt) and `api` (FastAPI, entrypoint `app.asgi:app`, install `uv sync --locked`). Both are rooted at the repository root, and every push builds and ships them as one deployment. `vercel.json` also routes the public traffic. `/api/v1/*`, `/healthz` and `/readyz` go to `api` with the path unchanged, `/metrics` has no route at all, and everything else goes to `web`. Its `regions` key puts every function in `fra1`, beside Neon in `eu-central-1`. Production branch is `master`; preview deployments are off. Decision 012 holds the why. Decision 007 is the two-project layout this replaced.

Vercel Authentication is on for the project. It guards deployment URLs, never the production domain, so the browser's calls to `/api/v1` pass untouched.

### Operate

Every command names its project. A checkout linked to another project once sent production variables to the wrong place (Quirks).

```bash
vercel link --project z-team-planner --scope obradovic-co   # bind this checkout (once)
vercel deploy --prod                                        # deploy the working tree to production
vercel promote <deployment-url>                             # make an earlier deployment production again
vercel env ls production --project z-team-planner           # what the next build will read
vercel logs <deployment-url>                                # runtime logs for one deployment, both services
```

A push to `master` deploys. Everything else is dashboard work: environment variables and project settings.

The project holds both halves' variables, and every service sees all of them. The frontend reads the four `NUXT_PUBLIC_FIREBASE_*`, `NUXT_SITE_URL`, `NUXT_SITE_ENV`, and `NUXT_PUBLIC_API_BASE_URL` set to `/api/v1`. The API reads `APP_ENV`, `DATABASE_URL`, `DATABASE_URL_DIRECT`, `FIREBASE_PROJECT_ID` and `FIREBASE_SERVICE_ACCOUNT_JSON`. Sharing is harmless: `Settings` ignores names it does not declare, and Nuxt reads only its own prefixes. `CORS_ALLOW_ORIGINS` stays unset, because no browser crosses an origin.

### Recovery

Rolling back is `vercel promote` against an earlier deployment (Instant Rollback in the dashboard). It reassigns the production domain immediately, with no rebuild, and moves the frontend and the API together, since they are one deployment. A rollback can therefore never pair a frontend with an API it was not built beside. There is nothing here to restore: the frontend is a build artifact and the API holds no data of its own. Data recovery is the Neon section's drill.

### Quirks

- **`.vercelignore` is load-bearing, not tidiness.** The CLI uploads the working tree and does not honour `.gitignore` reliably. A local `.output` made production serve a stale `index.html` asking for chunk hashes the remote build had never produced — the page rendered, hydrated nothing, and no click worked. A local `.env` then baked `http://localhost:8000` into the payload and re-enabled sign-in. Both were the same leak. Vercel's project settings are the only source of production configuration.
- **Diagnosing a page that renders but does nothing:** compare the entry chunk the served HTML asks for against one the build log says it emitted. If the HTML's chunk 404s and the log's chunk 200s, the HTML is stale — not the assets.
- **A `NUXT_PUBLIC_*` change needs a redeploy, not an environment edit.** `/` is prerendered, so those values are baked into the payload at build time. Editing the variable in the dashboard changes nothing until the next build.
- An **empty `NUXT_PUBLIC_API_BASE_URL` is a valid deployment**, not a broken one: it means no API is behind this frontend and sign-in is unavailable (feature 006). The missing Firebase variables still fail the build, loudly, in the `ready` hook.
- **The relative `/api/v1` works only on the deployed origin.** Local development runs Nuxt and the API as two processes on two ports, so `.env` keeps the absolute `http://localhost:8000/api/v1` and the CORS allowlist that goes with it.
- **Pass `--project` to every `vercel env` command.** Without it the CLI acts on whatever the current directory is linked to. On 4 October 2026, database variables meant for a scratch project landed on production from the main checkout. Nothing read them, and they were removed.
- **`vercel link` edits the repository.** It appends `.env*` to `.gitignore` and writes a development token to `.env.local`. Revert the first and delete the second: `.env.*` is already ignored, and the token is never needed.
- **Both services pin `framework`.** They share the repository root, where `package.json` and `pyproject.toml` sit side by side, and detection would otherwise have to guess which framework each one is.
- **The `entrypoint` is `module:object`, never a file path.** `app/asgi.py` looks obviously right and fails the build with `no matching module file was found`; the value is `app.asgi:app`. It sits on the `api` service in `vercel.json`, its only home.
- **A routed service never falls back.** A path that matches the `api` rewrite and that FastAPI does not serve returns the API's own 404 error envelope, never the frontend's page. That is why only `/api/v1/*` and the two health paths go to it: Nuxt serves routes under `/api/` too, and Nuxt Icon's `/api/_nuxt_icon/…` sent to FastAPI left every icon not bundled into the page blank (decision 014). `test/unit/vercel-routes.test.ts` runs the table against real paths.
- **Preview deployments are off, and the switch is a dashboard project setting** — production-only building, set in the project's build/deployment settings. Nothing in the repository turns them off, which is the whole hazard: this setting reverted once and nobody noticed until a Renovate PR carried a failing Vercel check. Confirm it by pushing any branch other than `master` and looking for the absence of a Vercel check — not a skipped one, none at all. It moved out of Settings → Git at some point, so hunt by setting name rather than by path.
- **Write the Ignored Build Step as an explicit `if`, never a bare test.** The project means "build production only", but only this form is known to work here:

  ```bash
  if [ "$VERCEL_ENV" == "production" ]; then exit 1; else exit 0; fi
  ```

  The terse equivalent `[ "$VERCEL_ENV" != "production" ]` **skips production too**. The old API project shipped with it briefly and its first git-triggered production deploy came back `Canceled` with a `0ms` build, which reads like an infrastructure hiccup rather than a config error. A skipped build is not a failed one: nothing goes red, and the old deployment just stays live.

- **Why previews are not turned off in the repository.** `vercel.json`'s `git.deploymentEnabled` takes a bare `false`, which stops production deploying too, and its per-branch form would need every future branch listed. A per-service `ignoreCommand` lets Vercel create the deployment and start the build before aborting it, so the deployments list fills with aborted builds.
- **A preview build cannot succeed here even by accident.** The Firebase `NUXT_PUBLIC_*` variables are scoped to Production, so a preview build reaches `nuxt.config.ts`'s `ready` guard with none of them and fails on `Missing required public runtime config`. That is the guard working — a build without config is not a deployable artifact — but it means a stray preview always shows up as a red check rather than a quiet one.
- **Only the function region is `fra1`.** Builds still run in `iad1`, which is fine, since no build talks to the database. Vercel's default function region is `iad1`, so deleting `regions` from `vercel.json` would put an ocean between every query and Neon.
- **Alembic never runs on Vercel.** Migrations are manual, from a workstation, against the direct endpoint — the Neon section's commands.
- Vercel's **Neon marketplace integration is not used**: it injects a single `DATABASE_URL`, and this project needs the pooled and direct endpoints separately. Both variables are set by hand.

## Portrait images (Vercel Image Optimization)

The twelve hero portraits in `public/images/portraits/` are lossless WebP masters at the bust's native size; Vercel's optimizer resizes and re-encodes them on request. `nuxt.config.ts` holds the whole configuration — `image.screens` is derived from the per-usage widths in `web/config/portraits.ts` and becomes the optimizer's allowed `sizes`, `image.quality` is 90, and the one-year edge TTL is `image.vercel.minimumCacheTTL`. Feature 021 holds the why. The same values also sit in `vercel.json`'s top-level `images` block, because a Services deployment drops the block Nitro emits from the web service (decision 014). `test/unit/vercel-images.test.ts` fails when the two disagree, so a width or TTL change edits `nuxt.config.ts` and `vercel.json` together.

### Operate

```bash
curl -sI -H 'Accept: image/avif,image/webp,*/*' \
  'https://z-team-planner.vercel.app/_vercel/image?url=%2Fimages%2Fportraits%2Fgolem.webp&w=216&q=90'
                                            # what a card variant actually serves: type, length, x-vercel-cache
vercel cache invalidate --srcimg /images/portraits/golem.webp
                                            # after replacing one master, so the edge stops serving the old one
```

Transformation and cache-read counts are dashboard work: the project's Usage page, Image Optimization.

### Recovery

Replacing a portrait: overwrite the master under its existing name, deploy, then run the invalidate command above for that path. Filenames are never versioned, so without the invalidation the edge keeps the old image for up to a year. Never performed against production — the first portrait replacement is the drill.

### Quirks

- **`image.screens` is not a breakpoint list, and the module's own defaults hide inside it.** The Vercel provider snaps every requested width **up** to the nearest value present, and the same values become the optimizer's allowed `sizes` — a request outside them is a 400. `@nuxt/image` merges its `sm` 640 … `2xl` 1536 defaults _under_ whatever is configured, so `portraitScreens()` reuses those five keys for real widths; without that the allowlist carries five sizes the app never renders. `test/unit/portrait-sizes.test.ts` keeps both halves honest.
- **The Vercel provider does nothing in `nuxt dev`** — it returns the source URL untouched, and IPX serves instead without snapping to `screens`. A width that would overfetch in production looks perfect locally, which is why the parity check is a test and not a dev-server walk.
- **The TTL is `image.vercel.minimumCacheTTL`, and leaving it out is silent.** The Vercel provider writes 300 seconds when the option is unset, so a refactor that drops it restores the five-minute cache with no error. `test/unit/vercel-images.test.ts` holds `vercel.json` to the same value.
- **Portraits and the background missing while the page works means the image block is gone.** In a Services deployment Vercel builds its optimizer settings only from `vercel.json`'s top-level `images`; the block Nitro writes into the web service's output is discarded, and `/_vercel/image` then falls through the catch-all to Nuxt's JSON 404 (`Page not found: /_vercel/image…`). Check with the `curl` under Operate: a 404 with `application/json` is this, a 400 is a width outside `sizes`.
- **The masters are not all the same size** (450 to 512 px). Neither Vercel nor IPX enlarges, so a request above a given master's size returns that master — the 2x panel variant is 512 for most heroes and less for Coupé, Invisigal, Malevola and Sonar.
- **Optimized images are not browser-cached.** Vercel sends `cache-control: public, max-age=0, must-revalidate` on them whatever the edge TTL is, so an invalidation reaches readers on their next load.

## API service

FastAPI in `app/`, run with uv. Stateless: it holds no data of its own, so everything below is about starting it and reading what it says. Structure and invariants are `app/CLAUDE.md`.

### Operate

```bash
uv sync --locked                                        # install exactly the lockfile
uv run uvicorn app.main:create_app --factory --reload --port 8000   # development
curl -sS localhost:8000/healthz                         # liveness: {"status":"ok","version":"0.1.0"}
curl -sS -i localhost:8000/readyz                       # readiness: 200 ready / 503 not_ready
curl -sS -i localhost:8000/healthz | grep -i x-request-id   # the id every response carries
uv run pytest                                           # -m "not integration" without Docker
uv run python -m scripts.reset_db --yes                 # drop + migrate, development only
METRICS_ENABLED=true uv run uvicorn app.main:create_app --factory   # then GET /metrics
```

Against the deployed service, where there is no process to start and no shell to start it in:

```bash
curl -sS https://z-team-planner.vercel.app/healthz              # liveness, and the release that is live
curl -sS -i https://z-team-planner.vercel.app/readyz            # readiness; allow ~1.1s on a cold Neon
vercel logs <deployment-url>                                    # runtime logs for one deployment
vercel env ls production --project z-team-planner               # what the next build will read
vercel promote <deployment-url>                                 # roll back by making an earlier deployment production
```

`reset_db` has no deployed equivalent and must never gain one: it drops the schema. Production schema changes are Alembic, run by hand from a workstation against the direct endpoint (the Neon section).

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

## Releases

The product's own version, which is unrelated to the `Catalyst version` stamp. Root `VERSION` holds the number, and `package.json` and `pyproject.toml` carry copies. `CHANGELOG.md` holds the release notes. A release is a deliberate act by the maintainer and never follows from a merge alone. Decision 013 holds the why.

### Operate

Activate the hooks once per clone. The two tag hooks tag `v<VERSION>` whenever a commit or merge on `master` changes `VERSION`:

```bash
git config --unset core.hooksPath      # only if this clone still points at the old .githooks/
sh catalyst/tools/hooks/install.sh     # pre-commit, post-commit and post-merge into .git/hooks
```

Cutting release `X.Y.Z`, on `master`:

1. In `CHANGELOG.md`, move the `Unreleased` entries under a new `## [X.Y.Z] - <date>` heading, and write its Overview. Add a **Database** line if any migration landed since the last release.
2. Set `X.Y.Z` in `VERSION`, `package.json` and `pyproject.toml`, then run `uv lock`: `uv.lock` records the project's version too, and a stale one fails `uv sync --locked`.
3. Commit the four files and the changelog together. The hook prints `tagged vX.Y.Z`.
4. Push, then confirm the deployed API reports the new number:

```bash
git push && git push origin vX.Y.Z
curl -sS https://z-team-planner.vercel.app/healthz     # {"status":"ok","version":"X.Y.Z"}
```

Below `1.0.0`, MINOR marks a new user-facing capability and PATCH marks fixes and polish.

### Recovery

- **The hook did not tag**, because it was not active or the release came in another way: `git tag vX.Y.Z <release-commit>`, then push the tag.
- **A tag points at the wrong commit and has not been pushed**: `git tag -d vX.Y.Z` and tag again. Once pushed, a tag is never moved. Cut the next PATCH instead.
- **The API stopped answering after a release**: roll back with `vercel promote` (Vercel hosting), then check that `VERSION` exists and is not empty. The API reads it at import and refuses to start without it.

### Quirks

- The hooks tag locally only. A release whose tag was never pushed is invisible to everyone but this clone.
- `post-commit` sees releases committed on `master`; `post-merge` sees releases that arrive by merge or pull. A release merged on GitHub is tagged only when it is pulled into a clone with `post-merge` active.
- Nothing checks that the three files agree. A mismatch shows as `/healthz` reporting a number the manifests do not.

## Neon Postgres

One Neon project, one long-lived `dev` branch besides `main`, CI branches created on demand with an expiry. Application traffic uses the **pooled** endpoint; migrations and anything session-scoped use the **direct** one.

### Operate

```bash
neon branches list                                      # branches, their computes, expiry
neon connection-string --branch dev                     # direct endpoint (migrations)
neon connection-string --branch dev --pooled            # pooled endpoint (the API)
gh workflow run migrate.yml -f confirm=migrate          # the normal route: backs up, then upgrades to head
gh run list --workflow migrate.yml --limit 5            # how the last dispatches went
uv run alembic current                                  # applied revision (env.py reads DATABASE_URL_DIRECT itself)
uv run alembic upgrade head                             # the manual fallback — direct endpoint only
neon branches create --name ci-<sha> --expires-at <rfc3339>   # throwaway CI branch, ≤30 days
```

### Recovery

Two tiers. Neon's own instant restore covers the last **6 hours** on the Free plan (Launch: up to 7 days) — enough for "undo the last bad migration", not for losing the project. The dumps in R2 (next section) are the real backup.

Instant restore, inside the window: branch `main` as it stood at a timestamp, check the rows there, and only then reset `main` itself. `--parent` with a timestamp branches from the default branch; the reset keeps the pre-restore state under the preserve name, which takes one of the ten branch slots until it is deleted.

```bash
neon branches create --name pitr-test --parent <rfc3339>                         # main as it stood then
neon branches restore main ^self@<rfc3339> --preserve-under-name main-before-restore   # the real reset, after the check
```

Rehearsed: **2 October 2026**, passing — a branch at `10:05:40Z` held the one build created at `10:05:33Z` and neither of the two created at `10:05:43Z` and `10:05:51Z`, with 1 of `main`'s 3 idempotency keys, at revision `182ad318ac94`; `main` kept all 3 builds. The in-place `restore` was not run against `main`.

Restore from a dump, on a scratch branch first. Fetching the dump uses the read-only recovery token, not CI's (next section).

```bash
neon branches create --name restore-test                # or the console, if the CLI stalls
aws s3api get-object --bucket ztp-backups --key ztp-<stamp>.sql.gz.gpg ztp-<stamp>.sql.gz.gpg
aws s3api get-object --bucket ztp-backups --key ztp-<stamp>.manifest.json ztp-<stamp>.manifest.json
psql "$SCRATCH_URL" -c 'drop schema public cascade' -c 'create schema public'
gpg --decrypt ztp-<stamp>.sql.gz.gpg | gunzip | psql "$SCRATCH_URL" -v ON_ERROR_STOP=1
```

**Choose the dump by its manifest, not by its position in the list.** To undo a migration, take the newest dump whose manifest says `"reason": "pre-migration"` and whose `taken_at` precedes the migration — a later scheduled dump already holds the migrated schema. Then confirm the choice: its `revision` must match the "Show the revision before" step of that `migrate.yml` run.

**Empty the scratch branch before restoring.** A Neon branch is a copy of its parent, so it arrives holding the schema already and the dump's `CREATE TABLE` statements collide with it. A real recovery restores into an empty database; a drill that skips the wipe tests nothing.

Then take the same census the manifest carries and compare the two objects whole — table names and counts together, not a couple of hand-picked tables — and check that `select version_num from alembic_version` on the branch returns the manifest's `revision`. Matching, the branch can be promoted or the restore repeated against `main`.

**Delete the local files once the census is taken.** The dump and its plaintext hold user emails, and the commands above leave them in the working directory. Fetch into a `mktemp -d` that is removed on exit, and delete the `restore-test` branch with them.

Rehearsed: **2 October 2026**, passing — dump `ztp-2026-10-02T100636Z` (a `manual` run), restored into a scratch branch: census identical to the manifest at 1 user, 3 builds, 3 idempotency keys, `version_num` equal to its `revision` `182ad318ac94`. The rows were seeded through the live site for the drill, so `main` held still between dump and restore, and a per-table content hash of the branch also matched `main`'s. Volume is still untested: the first rehearsal (21 September) restored the schema with zero rows. Due again after every material schema change.

### Quirks

- The pooled endpoint is PgBouncer in transaction mode: `SET`, `LISTEN/NOTIFY`, temp tables and session-level advisory locks are unsupported, and **advisory locks fail silently**. Alembic must never see the pooled URL.
- **`migrate.yml` takes a backup before it migrates**, by calling `backup.yml` rather than copying its steps — a dump taken any other way is one the restore drill has never rehearsed. It passes `reason: pre-migration`, which the manifest records. A failed backup stops the migration. It refuses to run unless the dispatch input is exactly `migrate`, and it only ever goes to `head`: forward-only, so a rollback is a new migration and there is no downgrade path.
- **One secret, two spellings.** `NEON_DIRECT_URL` is stored as plain `postgresql://` because `pg_dump` rejects anything else; `migrate.yml` rewrites it to `postgresql+psycopg://` for SQLAlchemy and immediately re-masks it. GitHub only masks the exact stored string, so the rewritten one would print in clear text if any step echoed it.
- **Migrations read `MigrationSettings`, not `Settings`.** That is why the workflow needs one secret instead of the application's four, and why a Firebase key never reaches a job that authenticates nobody.
- Free-plan computes suspend after 5 minutes idle and this cannot be disabled. A pool that held a socket across the suspend gets `SSL SYSCALL error: EOF detected`; the engine runs `pool_pre_ping=True`, `pool_recycle=240` (not 300 — that races the boundary) and `connect_timeout=10`.
- Always spell the driver: `postgresql+psycopg://`. A bare `postgresql://` means psycopg2 on SQLAlchemy 2.0 and psycopg 3 on 2.1 — the driver would swap on a routine bump.
- Free-plan ceilings: 0.5 GB storage, 10 branches, 100 CU-hours per month. Expired CI branches free their slot; a forgotten `restore-test` branch does not.
- **`neonctl` can hang rather than fail when its stored token needs refreshing** — no prompt, no error, just a call that never returns. It stalled the stage 2 setup once. The console is the fallback for anything the CLI will not answer, and `neon auth` is the fix.

## Backups (GitHub Actions → Cloudflare R2)

A **backup run** executes `backup.yml` once and leaves one **dump** and one **manifest**. Three things start one, and the manifest's `reason` names which: the schedule (`scheduled`), a dispatch of `backup.yml` (`manual`), or `migrate.yml` before it touches the schema (`pre-migration`). The run takes `pg_dump` against the direct endpoint, encrypts with a repository-secret GPG key, and uploads to a private R2 bucket. Nothing is ever attached as a workflow artifact — this repository is public and artifacts are downloadable by anyone.

The schedule fires once a day from a `17 3 * * *` cron. GitHub starts it late under load: about 6 to 7 hours late (six runs, 3 to 8 October 2026), and the off-hour minute made no measurable difference. Nothing depends on the hour. The one window to avoid is Neon's Thursday 01:00–02:00 maintenance, which a 03:17 cron reaches only after a delay of more than 21 hours. The guarantee is one scheduled dump per day, not a dump at night.

The **missed-run alert** watches that guarantee from outside GitHub (decision 011). Every scheduled run that finishes checks in with a healthchecks.io check, and a scheduled run that fails reports `/fail` there. The check is configured by hand, and these two settings are its source of truth: **period 1 day, grace 8 hours**, with alerts going to the maintainer's email. When 32 hours pass without a scheduled check-in, or a failure is reported, the email goes out. Manual and pre-migration runs never check in, so they cannot hide a stopped schedule. The ping URL is the repository secret `HEALTHCHECKS_PING_URL`. A ping that cannot be delivered only warns, and it never fails the run.

### Operate

R2 speaks the S3 API, so the `aws` CLI drives it — every call needs the account's R2 endpoint and a region the service ignores but the SDK demands.

```bash
gh workflow run backup.yml                              # trigger out of schedule
gh run list --workflow backup.yml --limit 5             # last runs
export AWS_ENDPOINT_URL=https://<account-id>.r2.cloudflarestorage.com AWS_DEFAULT_REGION=auto
aws s3api list-objects-v2 --bucket ztp-backups --prefix ztp-   # what is in the bucket
aws s3api get-object --bucket ztp-backups --key ztp-<stamp>.sql.gz.gpg ztp-<stamp>.sql.gz.gpg
```

The missed-run alert lives at healthchecks.io: its dashboard shows each scheduled check-in. To rehearse the alert by hand, run `curl -fsS "$HEALTHCHECKS_PING_URL/fail"`, then send a plain ping to reset it.

Every backup run leaves two objects of its own: `ztp-<stamp>.sql.gz.gpg` and a plaintext `ztp-<stamp>.manifest.json`. The stamp is the run's UTC start to the second, spelled `2026-09-21T103727Z`, so the list sorts chronologically and any number of runs can share a day. Dumps taken before 29 September 2026 carry the date alone; they age out with the rest. The manifest is a census of every table in `public` with its exact row count — taken at runtime, so a renamed table changes the census instead of breaking the job — and it is what the restore drill compares against. `alembic_version` stays in the census like any other table, and its one row's `version_num` is also the manifest's top-level `revision`: the schema the dump holds. Manifests written before 2 October 2026 have no `revision`; they age out with the rest.

### Recovery

The restore drill is the Neon section's. Two credentials make it possible, and **neither is reachable through GitHub** — a disaster is the wrong moment to discover that recovery depends on the CI provider being up.

| Password-manager entry                       | What it is                               | Why not CI's                                                                                           |
| -------------------------------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `z-team-planner backup GPG key`              | the private half, plus the fingerprint   | only the public half is a repository secret, so CI can encrypt, never read                             |
| `z-team-planner R2 read-only recovery token` | account id and an S3 key pair, read-only | CI's token is write-capable and was displayed once; this one cannot delete a backup while restoring it |

Lose the GPG entry and every dump ever taken is unreadable.

### Quirks

- A dump holds user emails: personal data. Retention follows the accounts feature document; the workflow prunes dumps older than that window on every run, so the bucket never becomes a shadow copy with its own retention.
- R2's free tier is far beyond two small tables; the thing that grows is the number of dumps, not their size. Pruning is what keeps it free.
- **The client's major version must match Neon's server**, which is why the job installs `postgresql-client-18` from PGDG rather than using the runner's own. `pg_dump` refuses a server newer than itself, and the failure names the versions — read it before suspecting the connection.
- **`NEON_DIRECT_URL` is spelled `postgresql://`, not `postgresql+psycopg://`.** That prefix is SQLAlchemy's; `pg_dump` and `psql` reject it. This is the one place in the project where the bare scheme is correct.
- Pruning runs only after a successful upload, so a failed dump can never shrink the set. A run that fails mid-way leaves the earlier dumps untouched.
- **GitHub disables a public repository's scheduled workflows after 60 days without activity**, and also skips scheduled runs now and then under load. In both cases nothing fails, so only the missed-run alert notices. After an alert, `gh run list --workflow backup.yml` shows whether the run failed or never started. If it never started, run `gh workflow enable backup.yml` and then dispatch a run, because the next scheduled one is up to a day away.
- A run's first call usually wakes a suspended Neon compute, so the dump step starts about a second slow. That is the Neon section's suspend behaviour, not a stalled job.
- **A dump is never overwritten.** Both uploads send `If-None-Match: *`, so R2 answers `412 Precondition Failed` for a key that exists and the run fails. The stamp keeps runs apart; the guard makes a collision loud. A day routinely holds more than one dump: the scheduled run starts hours after its cron (above), so a scheduled dump can land after a same-day migration.
- **An `alembic_version` without exactly one row fails the job on purpose.** A missing table counts as zero. Zero means the schema is gone and the dump is an empty file, and a scheduled run reporting success over one is the failure mode backups are famous for: check `main` before re-running anything. Several rows means a schema no forward-only migration left behind: run `uv run alembic current` against the direct endpoint first.

## GitHub repository security

Three settings that live in the repository rather than in this tree, so nothing here fails when they are off — they simply stop reporting. All three are free on a public repository and none touches CI. Decision 009 holds the why.

### Operate

```bash
gh api repos/{owner}/{repo} --jq '.security_and_analysis'          # secret scanning + push protection
gh api repos/{owner}/{repo}/vulnerability-alerts -i | head -1      # 204 = alerts on, 404 = off
gh api repos/{owner}/{repo}/dependabot/alerts --jq 'length'        # open advisories, both lockfiles
gh api -X PUT repos/{owner}/{repo}/vulnerability-alerts            # turn alerts back on
```

Enabling needs a token with `repo`; the settings pages are **Settings → Code security**.

### Recovery

Nothing to restore — re-enable and the scans re-run over current history. A fork or a transfer starts with all three **off**, which is the case worth re-checking rather than assuming.

### Quirks

- **Renovate's advisory path depends on Dependabot alerts being on.** `vulnerabilityAlerts` defaults to jumping the schedule, but on GitHub the advisories feeding it come from here. With alerts off the feature is configured and starved, and nothing anywhere reports that — the bot simply never files a security PR.
- `dependabot/alerts` answers **403 with a message**, not an empty list, when alerts are disabled. A script reading `length` on that will crash rather than report zero, and a script ignoring the error will report "no advisories" while blind.
- **Alerts read empty for a few minutes after enabling**, before the first scan finishes. Reading the count straight after the `PUT` reports zero and means nothing.
- The endpoint pages at 100. `--paginate` or a count taken from one page will under-report a backlog this size.
- Dependabot **security updates** (the PR-opening half) stay off on purpose: Renovate opens those PRs, and both bots on one lockfile means duplicate PRs racing each other.

## Firebase Authentication

Spark plan, Google sign-in only. Firebase holds identities; the app's own `users` table holds the Firebase uid **and** the Google subject so the table stays portable.

### Operate

The API needs two variables: `FIREBASE_PROJECT_ID` (the issuer and audience every token is checked against) and the service-account key. Locally that is `FIREBASE_SERVICE_ACCOUNT_FILE`, a path to a key kept outside this public repository; on Vercel there is no filesystem to keep one on, so the whole key travels as `FIREBASE_SERVICE_ACCOUNT_JSON` instead. The two are mutually exclusive and setting both stops the process. In development the emulator replaces the key — set `FIREBASE_AUTH_EMULATOR_HOST` instead, and the SDK stops checking signatures.

Authorized domains include `z-team-planner.vercel.app` and the consent screen is published, so sign-in is open to anyone rather than capped at named test users. The app-domain links that publishing requires live on **Google Auth Platform → Branding**, which is a different page from the **Audience** page that carries the publish button.

```bash
firebase auth:export users.json --format=json           # full user list, round-trippable
firebase auth:import users.json --hash-algo=...         # import (hash options per the Firebase docs)
firebase emulators:start --only auth                    # local emulator on port 9099
```

### Recovery

Firebase is a vendor: there is no restore, only export. The documented `auth:export` / `auth:import` round-trip is the exit path, together with the stored Google subject. Exercised: **21 September 2026**, returning zero users — sign-in had never been available, so this proves the command, the project id and the output format, nothing about volume. Quarterly from here, and again once real accounts exist.

### Quirks

- `FIREBASE_AUTH_EMULATOR_HOST` set outside development is a **total auth bypass** — emulator tokens are unsigned. The API refuses to start with it set unless the environment is explicitly development.
- **The emulator needs `--project`, and it must match `FIREBASE_PROJECT_ID`.** `firebase emulators:start --only auth` on its own mints tokens for `demo-no-project`, and the API refuses every one of them with a `401` — it checks the audience, so the failure looks like a broken sign-in rather than a misconfigured emulator.
- The token's `sub` is the Firebase uid, not the Google account id. The Google subject is in `firebase.identities`; copy it at first sign-in, never rely on reading it later.
- Do not upgrade the project to Identity Platform: it caps social sign-in at 3,000 DAU/day where plain Firebase Auth has no cap, and the upgrade has no documented downgrade path.
- Unverified Google-only apps show `<project-id>.firebaseapp.com` on the consent screen, not the app name. Harmless, but users will ask.
