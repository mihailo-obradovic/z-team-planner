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

One project, `z-team-planner`, with two services — the Nuxt frontend and the FastAPI backend — declared in a root `vercel.json`. Top-level rewrites send `/api/v1/(.*)`, `/healthz` and `/readyz` to the backend — never all of `/api/`, where Nuxt modules serve routes of their own (decision 014) — with the path preserved, and everything else to the frontend. `/metrics` gets no rewrite and is unreachable by construction. The frontend calls the API on its own origin: production `NUXT_PUBLIC_API_BASE_URL` becomes `/api/v1`, feature 006's empty-means-unavailable rule unchanged, and `CORS_ALLOW_ORIGINS` is left unset, so the allowlist is empty. The Python `entrypoint` moves from `pyproject.toml` into the service object, its one home.

Both services keep the repository root as their `root`, with `framework` pinned so detection never has to choose between `package.json` and `pyproject.toml`. Nothing moves. The docs show only subdirectory roots, so this was settled by a probe before any file moved: a scratch project deployed from the CLI against the Neon `dev` branch built and routed the shared root on the first try, and the subdirectory layouts were never needed. `shared/` stays where it is; the API bundle carries the fixture it reads. The region is `regions: ["fra1"]` in `vercel.json`, which services mode honours, so it leaves the dashboard.

`vercel.json` rather than the recommended `vercel.ts`: `@vercel/config` 0.9.0 types only the superseded `experimentalServices` key, so it cannot express `services` yet.

Supersedes 007, whose `vercel.json` ban existed only because two projects shared one root.

## Scope

`vercel.json`; `pyproject.toml` (the `[tool.vercel]` block removed); `.env.example`; `operations.md` (Vercel hosting), feature 006, the `.vercelignore` comment, and the README's hosting line. No behavior contract changes.

## Consequences

Better: one upload and one deployment per push; frontend and API never skew; no cross-origin request, so CORS carries nothing; `vercel.json` is available again.

Accepted: one function region, so the Nuxt server functions move to `fra1` with the API; the API inherits the project's Vercel Authentication, which covers deployment URLs only; Services is beta. Local development stays two processes with the absolute localhost URL. Feature 007's inert rate limit and the `/metrics` under-reporting are unchanged.

Cutover: `z-team-planner-api` (personal Hobby scope) stays live, its own CORS allowlist intact, until the new deployment verifies sign-in and a cloud build save; then it is deleted. The merged project never sets `CORS_ALLOW_ORIGINS`. Rollback before that is `vercel promote`; after it there is none. The dashboard steps — variables merged into one project, Root Directory blank, previews off — are a checklist in `operations.md`.

## Contracts Touched

- `operations.md`: Vercel hosting rewritten; API service URLs.
- `features/006_frontend-data-layer.md`: the `NUXT_PUBLIC_API_BASE_URL` row.
- `decisions/007_infra_hosting-vercel.md`: status `Superseded by 012`.
- `project-summary.md`: the ADR index rows for 007 and 012; a Technical Stack hosting row.

## Open Questions

## Verification
