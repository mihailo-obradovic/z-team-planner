# Decision: Host on Vercel — two projects, one repository

## Status

Implemented

## Type

infra

## Task Weight

Medium

## Context

Decision 004 declined deployment and left it as its own effort. The planner is useful on its own, while the API, Neon and Firebase were built but had only ever run locally. The constraint from 004 is unchanged: hobby project, free or very low cost.

## Decision

Both halves on Vercel, as two projects from this one repository, production branch `master`, preview deployments off.

|                 | `z-team-planner` | `z-team-planner-api`                  |
| --------------- | ---------------- | ------------------------------------- |
| Preset          | Nuxt             | FastAPI                               |
| Root Directory  | repository root  | repository root                       |
| Region          | default          | `fra1`, beside Neon in `eu-central-1` |
| Install Command | default          | `uv sync --locked`                    |

Vercel's FastAPI preset needs a module-level instance named `app`; this project builds through `create_app()` and deliberately has none. A thin `app/asgi.py` exports one, named by `pyproject.toml`'s `[tool.vercel] entrypoint`, keeping the factory true everywhere else. Appending `app = create_app()` to `app/main.py` was rejected: it would construct the application, and validate `Settings`, at import time — which the test suite triggers on every run.

**No `vercel.json` anywhere.** A project reads that file from its Root Directory, and both are rooted at the repository root, so one file would serve both. Its only remaining use is `maxDuration`, a `functions` glob that hard-fails any build where it matches no files — every Nuxt build. Python configuration lives in `pyproject.toml` instead, invisible to the Nuxt project by nature; the default duration is accepted.

Google Cloud Run was the genuine alternative: a container preserves single-process `/metrics` and the in-process rate limit as written. Dropped because both are already recorded as not surviving production — it buys a second deploy pipeline for nothing this project needs.

**Release is staged, because accounts carry data that cannot yet be restored.** Stage 1 is the frontend alone — planner, localStorage builds, `?build=` sharing — with no API project in existence, so nothing can accept a signup. Stage 2 creates the API project and enables sign-in, gated on all four of: the nightly `pg_dump` workflow built, a restore rehearsal passed, Firebase authorized domains plus a published consent screen, and the privacy page live.

## Scope

This record, `app/asgi.py` and the `[tool.vercel]` block, `Settings` gaining `FIREBASE_SERVICE_ACCOUNT_JSON` (the credential as env contents, mutually exclusive with the file path, validated at startup), the `firebase.client.ts` plugin and feature 006's build guard (see Consequences), a Vercel section in `operations.md`, and feature 004's privacy-policy section.

## Consequences

Two things in the code become decorative and must be read as such: feature 007's `/shared/*` token bucket is **inert in production**, since serverless instances each hold their own, and `/metrics` under-reports for the same reason. The risk is not the missing ceiling on a hobby app with unguessable ids — it is a future reader believing the ceiling works. Alembic never runs on Vercel; migrations stay manual against the direct `main` endpoint.

Neon needs nothing new: `main` is production, pooled for the API and direct for Alembic. Vercel's Neon integration is **not** used — it injects one `DATABASE_URL` and this project needs two. Sign-in is `signInWithPopup`, so redirect-flow cookie breakage does not apply, and only basic scopes are requested, so publishing the consent screen needs no Google verification review.

**Stage 1 needs one behavior change to be honest.** With real Firebase variables and no API, the sign-in button would stay enabled and a visitor would complete a Google sign-in before the app called an API that does not exist. An empty `NUXT_PUBLIC_API_BASE_URL` therefore means sign-in unavailable (feature 006 carries the rule): it reuses state the auth store already models, adds no flag whose only future is deletion, and self-heals in stage 2 when the variable is set. Because `/` is prerendered, the value is baked into the payload at build time: stage 2 is a redeploy, never an environment-variable edit alone.

## Contracts Touched

- `project-summary.md` — ADR index row.
- `operations.md` — new Vercel section; the `/shared/*` quirk reads as inert in production.
- `features/004_accounts.md` — privacy-policy section.
- `features/006_frontend-data-layer.md` — `NUXT_PUBLIC_API_BASE_URL` leaves the required-variables build guard and gains its sign-in-unavailable meaning.

## Open Questions

## Verification

Frontend and API suites green, oxfmt, oxlint, vue-tsc, ruff and pyright clean, `validate.py` 0 errors, and a production build passing the `build:before` guard with `NUXT_PUBLIC_API_BASE_URL` empty. **Stage 1 is live at <https://z-team-planner.vercel.app>**, verified on the live site: `apiBaseUrl` empty in the served payload, the entry chunk and three `/_vercel/image` sizes answering 200, and the sign-in control shipping `aria-hidden="true"` with `tabindex="-1"` — unavailable, not merely untested. The `.vercelignore` trap the first deploy hit is `operations.md`'s.
