# Decision: Init design — brownfield adoption of the de facto stack

## Status

Implemented

## Type

init-design

## Task Weight

Easy

## Context

Catalyst was adopted into an existing, working codebase: a client-only build calculator for the game Dispatch, started from the Nuxt UI starter template and already carrying its core features (roster overview, hero controls, synergy pairs; build persistence in progress). Per the Brownfield Adoption workflow, day zero confirms the stack the system already runs rather than designing one. Input: `context/product-description.md` and the running code.

## Decision

Confirm the de facto stack as the project's module set — frontend-only, no backend layer:

- `frontend/nuxt` (Nuxt 4, TypeScript, pnpm) with the `ssr` addon — the app is SSR with the index route prerendered; the Nitro `server/api/` surface is part of this module (one static data endpoint), not a separate backend.
- `frontend/ui = nuxtui` (NuxtUI v4 + Tailwind 4), matching the shipped UI.

Relative to Catalyst defaults this swaps the frontend module (`nextjs` → `nuxt`) and its UI choice (`shadcn` → `nuxtui`) — both carried by what already ships, not contested.

Optional layers walked in order:

| Layer                      | Verdict      | Why                                                                                                                      |
| -------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------ |
| Persistence (`postgres`)   | **declined** | builds persist in localStorage and share via URL by design; no server-side storage exists                                |
| Background work (`celery`) | **declined** | no async work outside request/response                                                                                   |
| Deployment                 | **declined** | single static/SSR app, no multi-service run story                                                                        |
| Identity (`keycloak`)      | **declined** | no accounts by design (product non-goal)                                                                                 |
| Maintenance (`renovate`)   | **deferred** | a committed lockfile exists, so the trigger technically fires; adopt via its own record when dependency currency matters |

Persistence, Identity and a backend were later adopted by decision 004; Maintenance by decision 009. Neither edits this record.

The repo's pre-adoption convention documents are superseded by the bundle, whose `_vue`/`nuxtui` documents were derived from them; the Dispatch game reference becomes `context/game-mechanics.md`.

## Scope

This record, the Technical Stack table in `project-summary.md`, the adapted entry documents (`project-summary.md` purpose, `context/product-description.md`, `context/game-mechanics.md`), the folder-document pointer seeding in `app/CLAUDE.md`, and toolchain alignment carried by the adopted stack (`stacks/_lang/typescript/toolchain.md`): ESLint/Prettier replaced by oxlint/oxfmt and the codebase reformatted. No behavior contracts touched.

## Consequences

The bundle's Nuxt/NuxtUI/TypeScript stack documents become normative for how code is written here. Retro-documenting shipped behavior (features one at a time, by breakage cost) follows as the Brownfield Adoption flow, not this record.

## Contracts Touched

- `project-summary.md` — Technical Stack rows, Project Purpose, this record's ADR index row.
- `app/CLAUDE.md` — folder orientation map with pointers into `catalyst/`.

## Open Questions

## Verification

Adoption scaffold reviewed against the running app: stack rows match `package.json` and `nuxt.config.ts` (Nuxt 4, NuxtUI 4, SSR with `/` prerendered), no database or auth code exists, and `python3 catalyst/tools/validate.py .` passes on the adopted documents.
