# Decision: Host on Vercel as one project with two services

## Status

Accepted

## Type

infra

## Task Weight

Hard

## Context

Decision 007 put the frontend and the API on Vercel as two projects from one repository, both rooted at the repository root. Every push to `master` uploads and builds the whole repository twice, the frontend calls the API across origins, and `vercel.json` is banned because both projects would read the same file. Vercel Services (beta, available on every plan) builds several frameworks inside one project and routes them from one `vercel.json` — the layout the two-project workaround stood in for.

## Decision

One project, `z-team-planner`, with two services — the Nuxt frontend and the FastAPI backend — declared in a root `vercel.json`. Top-level rewrites send `/api/(.*)`, `/healthz` and `/readyz` to the backend with the path preserved, and everything else to the frontend. `/metrics` gets no rewrite and is unreachable by construction. The frontend calls the API on its own origin: production `NUXT_PUBLIC_API_BASE_URL` becomes `/api/v1`, feature 006's empty-means-unavailable rule unchanged, and the production CORS allowlist becomes empty. The Python `entrypoint` moves from `pyproject.toml` into the service object, its one home.

The layout is settled by a probe, not up front. The docs require a `root` per service and show only subdirectories, while `@vercel/config`'s own types call `.` a service root's default. A scratch project deployed from the CLI against the Neon `dev` branch tries, in order: both services on the shared root with `framework` pinned; the frontend at `.` with the API under `api/`; both under `web/` and `api/`. The first that builds and routes is adopted, this record states which, and the scratch project is deleted.

`vercel.json` rather than the recommended `vercel.ts`: `@vercel/config` 0.9.0 types only the superseded `experimentalServices` key, so it cannot express `services` yet.

Supersedes 007, whose `vercel.json` ban existed only because two projects shared one root.

## Scope

`vercel.json`; `pyproject.toml` (the `[tool.vercel]` block removed); `.env.example`. If the probe moves files: the structural move as its own commit, then `ci.yml`, `migrate.yml`, the toolchain configs and the three `shared/` readers. `operations.md` (Vercel hosting), feature 006, the `.vercelignore` and `app/CLAUDE.md` comments, and the README's hosting line. No behavior contract changes.

## Consequences

Better: one upload and one deployment per push; frontend and API never skew; no cross-origin request, so CORS carries nothing; `vercel.json` is available again.

Accepted: one function region, so the Nuxt server functions move to `fra1` with the API; the API inherits the project's Vercel Authentication, which covers deployment URLs only; Services is beta. Local development stays two processes with the absolute localhost URL. Feature 007's inert rate limit and the `/metrics` under-reporting are unchanged.

Cutover: `z-team-planner-api` (personal Hobby scope) stays live until the new deployment verifies sign-in and a cloud build save; then CORS is emptied and the project is deleted. Rollback before that is `vercel promote`; after it there is none. The dashboard steps — variables merged into one project, region `fra1`, Root Directory blank, previews off — are a checklist in `operations.md`.

## Contracts Touched

- `operations.md`: Vercel hosting rewritten; API service URLs.
- `features/006_frontend-data-layer.md`: the `NUXT_PUBLIC_API_BASE_URL` row.
- `decisions/007_infra_hosting-vercel.md`: status `Superseded by 012`.
- `project-summary.md`: the ADR index rows for 007 and 012.
- `app/CLAUDE.md`: the location paragraph, if files move.

## Open Questions

## Verification
