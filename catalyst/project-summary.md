# z-team-planner

Catalyst version: 1.10.0

## Project Purpose

This project provides a build calculator for the game **Dispatch** (AdHoc Studio) to players planning their Z-Team. It displays the whole roster with per-hero controls for stat leveling, power training, and flight capability, computes synergy pairs and team-wide totals, and lets setup flags mirror the story's roster changes (who was cut in episode 3, who was hired in episode 4). Builds persist in the browser (localStorage) and are shareable via a URL parameter; signing in with Google additionally saves builds to a FastAPI backend on Neon Postgres, where they follow the user across devices and share by live link (decision 004). The game-mechanics reference all hero data is transcribed from is `context/game-mechanics.md`.

Context documents: `context/product-description.md`, `context/game-mechanics.md` (project-specific — loads on game-data or mechanics work), `context/design-reference.md` (project-specific — loads on UI styling or UI feature work) (`references/context-documents.md`)

## Feature Index

| ### | Feature                       | Status | Summary                                                                                                                                                                                                                                                                                             | Document                                                       |
| --- | ----------------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| 001 | Build persistence and sharing | Active | Builds persist in localStorage as named saves and share via a `?build=` URL parameter (compact v1 format); shared links open in a view-only mode until saved.                                                                                                                                       | [001_build-persistence](features/001_build-persistence.md)     |
| 002 | Hero data and domain model    | Active | The game data transcribed from the Dispatch reference — roster and starting stats (static Nitro endpoint), powers, flight, synergy pairs, budget constants — and the type system every feature consumes.                                                                                            | [002_hero-data](features/002_hero-data.md)                     |
| 003 | Planner mechanics             | Active | Interactive allocation under the game's budgets: level-ups and bonus levels, power and flight training, special powers, episode setup with roster resets, and the synergy-pair overview layout.                                                                                                     | [003_planner-mechanics](features/003_planner-mechanics.md)     |
| 004 | Accounts                      | Active | Optional Google sign-in via Firebase: a user record with a declared personal-data policy, a profile endpoint, total self-service deletion across both systems, and a one-time offer to keep local builds.                                                                                           | [004_accounts](features/004_accounts.md)                       |
| 005 | Account builds                | Active | Server-side builds for signed-in users under `/api/v1/builds` — validated against the game data, unique names per account, at most 20, idempotent create and import, ETag-guarded updates — and the error schema every API route shares.                                                            | [005_account-builds](features/005_account-builds.md)           |
| 006 | Frontend data layer           | Active | The layer the Nuxt app reaches the API through and the conventions every resource follows: one fetcher with a single 401 token-refresh retry, a central error policy, the query and mutation wrappers, Zod-parsed responses, one Pinia auth store, and the Nitro hero route retired for a constant. | [006_frontend-data-layer](features/006_frontend-data-layer.md) |
| 007 | Share links                   | Active | The live read-only share link for an account build: a token-less public read behind an unguessable id, the stopgap in-process ceiling protecting it, and the client-rendered `/b/{id}` page with **Save a copy** and its 404.                                                                       | [007_share-links](features/007_share-links.md)                 |
| 008 | Account builds in the planner | Active | The signed-in surface: account builds listed beside the local ones, Save and Save as new against feature 005's endpoints, the 412 conflict dialog, inline name errors, the account limit message, and the first-login offer's import path.                                                          | [008_account-builds-ui](features/008_account-builds-ui.md)     |
| 009 | Error page                    | Active | The app's own fatal-error screen, replacing Nuxt's default: the status code, the caller's own wording as the heading ("Build not found" for a dead share link, "Page not found" for an unknown route), one supporting line, and a single way back to the planner.                                   | [009_error-page](features/009_error-page.md)                   |

## Architecture Decision Record (ADR) Index

One line per record: type, status, title, link.

| ### | Type        | Status      | Decision                                                                        | Document                                                                                  |
| --- | ----------- | ----------- | ------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| 001 | init-design | Implemented | Brownfield adoption — confirm the de facto Nuxt/NuxtUI frontend stack           | [001_init-design_brownfield-adoption](decisions/001_init-design_brownfield-adoption.md)   |
| 002 | tooling     | Implemented | Adopt the Matt Pocock engineering skill pipeline, paths adapted into the bundle | [002_tooling_matt-pocock-skills](decisions/002_tooling_matt-pocock-skills.md)             |
| 003 | design      | Implemented | Instantiate the design system — Dispatch-styled reskin                          | [003_design_design-system](decisions/003_design_design-system.md)                         |
| 004 | infra       | Implemented | Adopt a backend — FastAPI, Neon Postgres, Firebase identity                     | [004_infra_backend-adoption](decisions/004_infra_backend-adoption.md)                     |
| 005 | bootstrap   | Implemented | Bootstrap the FastAPI service — scaffold, health, error envelope, Alembic       | [005_bootstrap_api](decisions/005_bootstrap_api.md)                                       |
| 006 | refactor    | Accepted    | Split build persistence, and settle what "build" means                          | [006_refactor_build-persistence-split](decisions/006_refactor_build-persistence-split.md) |

## Domain Decision Index

Present only when the project has standing cross-cutting domain/method decisions (e.g. "negative values are signal, never clipped") — pre-resolved judgment calls the agent follows and never re-litigates (`references/domain-decisions.md`). One line each: decision + short rationale. A local decision graduates here when it proves cross-cutting.

| Decision                       | Rationale |
| ------------------------------ | --------- |
| _No documented decisions yet._ | -         |

## Protected Areas

Pointer index of protections declared in lazy-loaded feature/decision documents. One row per area: name + owning document — never the rule text. Folder-document protections are not indexed; they load with their folder.

| Area                         | Owner                                                      |
| ---------------------------- | ---------------------------------------------------------- |
| Serialized build format (v1) | [001_build-persistence](features/001_build-persistence.md) |
| Hero ids and game data       | [002_hero-data](features/002_hero-data.md)                 |

## Technical Stack

One row per layer: the module chosen from Catalyst's `stacks/`, plus UI choices, adopted addons, and any optional layer. Filled at spawn; tells an agent which stack documents apply (`architecture.md` has the index).

| Layer           | Module                                                                                                  |
| --------------- | ------------------------------------------------------------------------------------------------------- |
| frontend        | nuxt                                                                                                    |
| frontend/addons | ssr                                                                                                     |
| frontend/ui     | nuxtui                                                                                                  |
| backend         | python-fastapi                                                                                          |
| persistence     | postgres (hosted on Neon)                                                                               |
| identity        | firebase-auth — swapped from `keycloak` by decision 004; no module document, the record is the contract |

## Status Values

Each index has its own status set — the validator rejects a row carrying another index's status.

**Features** (Feature Index):

- `Draft`: planned or partially specified; not yet approved.
- `Approved`: accepted as the contract; being implemented on a branch.
- `Active`: implemented and maintained.
- `Changing`: currently being redesigned or refactored.
- `Deprecated`: kept for compatibility but should not be expanded.
- `Removed`: intentionally removed; keep only if historical context matters.

**Decision records** (ADR Index): `Proposed` → `Accepted` → `Implemented`, plus `Superseded by <nnn>` when a later record replaces it.

## Summary Rules

Feature summaries: one to three sentences, specific enough to route an agent to the right document, free of implementation detail unless the boundary matters, updated when external behavior changes.

## Agent Usage

Use this file to decide which feature documents and decision records to load; never recursively load `features/` or `decisions/`.
