# Decision: Adopt a backend — FastAPI, Neon Postgres, Firebase identity

## Status

Implemented

## Type

infra

## Task Weight

Hard

## Context

Builds live only in the browser: localStorage plus a `?build=` share link. Clearing browser data loses them, and a build cannot follow its author to another device. The wanted difference is small and specific — **builds can be saved on the server after logging in** — but it needs three layers decision 001 declined, and it contradicts `context/product-description.md`, which still lists accounts and server-side storage as non-goals. Decision 001 reserved this for a new record rather than an edit.

A standing constraint shapes every choice below: this is a hobby project and must stay free or very low cost. Recurring fees at the ~99 USD/year scale are ruled out.

## Decision

Adopt three layers and swap one module:

| Layer       | Module                              | Note                                                          |
| ----------- | ----------------------------------- | ------------------------------------------------------------- |
| Backend     | `python-fastapi`                    | Catalyst default                                              |
| Persistence | `postgres` on **Neon** (serverless) | Catalyst default; MySQL was considered and dropped            |
| Identity    | **Firebase Authentication**         | Module **swapped** from `keycloak` — permitted, recorded here |

The backend owns exactly two things: **accounts** and **account builds**. Game data (hero ids, stats, powers, synergy pairs, budgets) stays in frontend code because it feeds the compile-time type system, which a database cannot; the server mirrors only the constants needed to validate a saved build.

Database access is **synchronous** SQLAlchemy with plain `def` FastAPI handlers. This is not a deviation: the module's `async def` preference concerns I/O that has an async client, and FastAPI prescribes `def` for blocking drivers. Driver is **psycopg 3**, dialect spelled explicitly (`postgresql+psycopg://`) because a bare URL changes driver at the SQLAlchemy 2.1 bump.

**Deployment stays declined.** With a managed database and a hosted IdP there is no multi-service run to orchestrate; only the API needs a host, and that is its own effort.

## Scope

This record; the Technical Stack table and ADR index in `project-summary.md`; four stack documents copied into `stacks/` (`backend/python-fastapi.md`, `database/postgres.md`, `_lang/python/python.md`, `_lang/python/toolchain.md`); pruning `architecture.md`'s Stack Modules table, which still carries the template's full list; `context/product-description.md`'s non-goals; a new `operations.md`; and the `app/` → `web/` rename that makes room for the FastAPI application at the root. No behavior contract changes — the serialized build format (v1) is untouched; the API's contracts arrive as feature documents.

## Consequences

The project gains a second language, a deploy target it lacks, and two vendors. Neon's free tier suspends after 5 minutes idle and has **no scheduled backups**, so the Universal Rule is met by a nightly encrypted `pg_dump` to object storage — GitHub Actions artifacts are unusable because this repository is public. Neon's pooled endpoint is PgBouncer in transaction mode, where session-level advisory locks fail silently; migrations use the direct endpoint. Tokens are validated through the Firebase Admin SDK behind one seam — it caches signing certificates correctly and is needed for account deletion regardless. A token's subject is a Firebase uid, not the Google account id, so both are stored: keying only on the uid would recreate the lock-in this record avoids. Personal data enters the project for the first time: the accounts feature document declares the fields, lawful basis, retention and self-service deletion. No Protected Areas rows are added.

## Contracts Touched

- `project-summary.md` — Technical Stack rows, ADR index row, Project Purpose.
- `architecture.md` — Stack Modules table pruned to what this bundle carries.
- `context/product-description.md` — non-goals redrawn; a phase added.
- `operations.md` — new: run, backup and restore procedures per component.

## Open Questions

## Verification

Five steps on `decision/004-backend-adoption`, each verified before commit. The four stack documents are byte-identical to Catalyst `v1.8.1` (`cmp`); every `stacks/` link in `architecture.md` resolves (scripted check, was 21 of 27 dangling); `catalyst/tools/validate.py .` reports 0 errors with `operations.md` present. After the `web/` move: oxfmt, oxlint and vue-tsc exit 0, vitest 3/3, and a production build prerenders `/` (194 KB). Nothing runs yet — the runbook's drill dates read _never_ until the API exists.
