# Decision: Host on Vercel — two projects, one repository

## Status

Accepted

## Type

infra

## Task Weight

Medium

## Context

Decision 004 declined deployment and left it as its own effort; `operations.md` still opens with "nothing is deployed anywhere". The planner is useful on its own, while the API, Neon and Firebase are built but have only ever run locally. The constraint from 004 is unchanged: hobby project, free or very low cost.

## Decision

Both halves on Vercel, as two projects from this one repository, production branch `master`, preview deployments off.

| | `z-team-planner` | `z-team-planner-api` |
| --- | --- | --- |
| Preset | Nuxt | FastAPI |
| Root Directory | repository root | repository root |
| Region | default | `fra1`, beside Neon in `eu-central-1` |
| Install Command | default | `uv sync --locked` |

Vercel's FastAPI preset needs a module-level instance named `app`; this project builds through `create_app()` and deliberately has none. A thin `app/asgi.py` exports one, named by `pyproject.toml`'s `[tool.vercel] entrypoint`, keeping the factory true everywhere else. Appending `app = create_app()` to `app/main.py` was rejected: it would construct the application, and validate `Settings`, at import time — which the test suite triggers on every run.

**No `vercel.json` anywhere.** A project reads that file from its Root Directory, and both are rooted at the repository root, so one file would serve both. Its only remaining use is `maxDuration`, a `functions` glob that hard-fails any build where it matches no files — every Nuxt build. Python configuration lives in `pyproject.toml` instead, invisible to the Nuxt project by nature; the default duration is accepted.

Google Cloud Run was the genuine alternative: a container preserves single-process `/metrics` and the in-process rate limit as written. Dropped because both are already recorded as not surviving production — it buys a second deploy pipeline for nothing this project needs.

**Release is staged, because accounts carry data that cannot yet be restored.** Stage 1 is the frontend alone — planner, localStorage builds, `?build=` sharing — with no API project in existence, so nothing can accept a signup. Stage 2 creates the API project and enables sign-in, gated on all four of: the nightly `pg_dump` workflow built, a restore rehearsal passed, Firebase authorized domains plus a published consent screen, and the privacy page live.

## Scope

This record and the ADR index row in `project-summary.md`. On approval: `app/asgi.py` and the `[tool.vercel]` block; `Settings` gains `FIREBASE_SERVICE_ACCOUNT_JSON` carrying the credential as env contents, mutually exclusive with the existing file path and validated at startup exactly as `FIREBASE_AUTH_EMULATOR_HOST` already is; the `firebase.client.ts` plugin and feature 006's build guard (see Consequences); a Vercel section in `operations.md`; feature 004's privacy-policy section.

## Consequences

Two things in the code become decorative and must be read as such: feature 007's `/shared/*` token bucket is **inert in production**, since serverless instances each hold their own, and `/metrics` under-reports for the same reason. The risk is not the missing ceiling on a hobby app with unguessable ids — it is a future reader believing the ceiling works. Alembic never runs on Vercel; migrations stay manual against the direct `main` endpoint, and become a dispatched workflow once the backup workflow exists to share its secret.

Neon needs nothing new: `main` is production, pooled for the API and direct for Alembic. The 5-minute suspend becomes user-visible as the recorded ~1.1s first request. Vercel's Neon integration is **not** used — it injects one `DATABASE_URL` and this project needs two. Firebase's three additions sit inside stage 2's gate; sign-in is `signInWithPopup`, so redirect-flow cookie breakage does not apply, and only basic scopes are requested, so publishing the consent screen needs no Google verification review.

**Stage 1 needs one behavior change to be honest.** `markSignInUnavailable()` fires only when Firebase fails to initialise, and in stage 1 the five `NUXT_PUBLIC_FIREBASE_*` values are real — so the sign-in button would stay enabled and a visitor would complete a Google sign-in before the app called an API that does not exist. An empty `NUXT_PUBLIC_API_BASE_URL` therefore comes to mean sign-in unavailable: it leaves feature 006's required-variables build guard, and the plugin calls `markSignInUnavailable()` when it is empty. This reuses state `useAuthStore` and `AuthMenu` already model, adds no flag whose only future is deletion, and self-heals in stage 2 when the variable is set.

A purchased domain is a stated future, not decided here: apex `A 76.76.21.21` and `www` `CNAME cname.vercel-dns-0.com`, or Vercel's nameservers. It touches authorized domains and `CORS_ALLOW_ORIGINS` again, so it gets its own effort.

## Contracts Touched

- `project-summary.md` — ADR index row.
- `operations.md` — new Vercel section; the `/shared/*` quirk amended from "protects nothing behind a proxy" to inert in production.
- `features/004_accounts.md` — privacy-policy section (the page itself is a backlog item).
- `features/006_frontend-data-layer.md` — `NUXT_PUBLIC_API_BASE_URL` leaves the required-variables build guard and gains its sign-in-unavailable meaning.

## Open Questions

## Verification

Not yet implemented. On approval, each step verified before commit: oxfmt, oxlint, vue-tsc, vitest and pytest green; a production `nuxt build` passing the `build:before` guard; `validate.py` reporting 0 errors; and stage 1 proven by the live browser walk against the deployed URL, with sign-in confirmed unavailable rather than merely untested.
