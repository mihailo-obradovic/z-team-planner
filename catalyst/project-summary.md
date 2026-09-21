# z-team-planner

Catalyst version: 1.15.0

## Project Purpose

This project provides a build calculator for the game **Dispatch** (AdHoc Studio) to players planning their Z-Team. It displays the whole roster with per-hero controls for stat leveling, power training, and flight capability, computes synergy pairs and team-wide totals, and lets setup flags mirror the story's roster changes (who was cut in episode 3, who was hired in episode 4). Builds persist in the browser (localStorage) and are shareable via a URL parameter; signing in with Google additionally saves builds to a FastAPI backend on Neon Postgres, where they follow the user across devices and share by live link (decision 004). The game-mechanics reference all hero data is transcribed from is `context/game-mechanics.md`.

Context documents: `context/product-description.md` (product vision and intent, behind this purpose paragraph); `context/game-mechanics.md` (project-specific — adding or changing hero data, powers, synergy pairs, or any rule whose correctness is defined by the game Dispatch; the reference all game data is transcribed from); `context/design-reference.md` (project-specific — styling or restyling UI, drafting or reviewing a UI feature document, or judging whether an interface change fits the product's look; the approved redesign the interface is built to); `context/glossary.md` (project-specific — naming a type, function, or variable that handles a build, reading code where "build" appears, or discussing one in a feature or decision document; the four meanings of the word and the term for each) (`references/project-documents.md`)

Convention annexes: `annexes/design-system.md` — styling anything, adding or changing a token, picking a size, shadow or spacing value, or building a new component. Styling values come from it — a raw hex or an off-scale px in a component is a defect; colour is named through the seven semantic aliases, never a ramp name (`references/project-documents.md`)

Agent adapters: `agents/domain.md`, `agents/issue-tracker.md`, `agents/triage-labels.md` — loads when the `mattpocock-skills` pipeline is in play: domain docs, the Workflowy issue tracker, and the triage labels, each redirected into this bundle (decision 002, `references/agent-skills.md`)

## Feature Index

| ### | Feature                       | Status | Summary                                                                                                                                                                                                                                                                   | Document                                                                         |
| --- | ----------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| 001 | Build persistence and sharing | Active | Builds persist in localStorage as named saves and share via a `?build=` URL parameter (compact v1 format); shared links open in a view-only mode until saved.                                                                                                             | [001_build-persistence](features/001_build-persistence.md)                       |
| 002 | Hero data and domain model    | Active | The game data transcribed from the Dispatch reference — roster and starting stats (static Nitro endpoint), powers, flight, synergy pairs, budget constants — and the type system every feature consumes.                                                                  | [002_hero-data](features/002_hero-data.md)                                       |
| 003 | Planner mechanics             | Active | Interactive allocation under the game's budgets: level-ups and bonus levels, power and flight training, special powers, episode setup with roster resets, and the synergy-pair overview layout.                                                                           | [003_planner-mechanics](features/003_planner-mechanics.md)                       |
| 004 | Accounts                      | Active | Optional Google sign-in via Firebase: a user record with a declared personal-data policy, a profile endpoint, total self-service deletion across both systems, and a one-time offer to keep local builds.                                                                 | [004_accounts](features/004_accounts.md)                                         |
| 005 | Account builds                | Active | Server-side builds for signed-in users under `/api/v1/builds`: validated against the game data, unique names per account, at most 20, idempotent create and import, ETag-guarded updates, and the error schema every API route shares.                                    | [005_account-builds](features/005_account-builds.md)                             |
| 006 | Frontend data layer           | Active | The layer the Nuxt app reaches the API through and the conventions every resource follows: one fetcher with a single 401 token-refresh retry, a central error policy, the query and mutation wrappers, Zod-parsed responses, one Pinia auth store.                        | [006_frontend-data-layer](features/006_frontend-data-layer.md)                   |
| 007 | Share links                   | Active | The live read-only share link for an account build: a token-less public read behind an unguessable id, its stopgap in-process ceiling, and the client-rendered `/b/{id}` page with **Save a copy** and its 404.                                                           | [007_share-links](features/007_share-links.md)                                   |
| 008 | Account builds in the planner | Active | The signed-in surface: account builds listed beside the local ones, Save and Save as new, the 412 conflict dialog, inline name errors, the account limit message, and the first-login offer's import path.                                                                | [008_account-builds-ui](features/008_account-builds-ui.md)                       |
| 009 | Error page                    | Active | The app's own fatal-error screen: the status code, the caller's own heading ("Build not found" for a dead share link, "Page not found" for an unknown route), one supporting line, and a single way back to the planner.                                                  | [009_error-page](features/009_error-page.md)                                     |
| 010 | Privacy page                  | Active | A prerendered, anonymously reachable `/privacy` page stating what is stored, why, for how long and how to erase it, plus the muted page-end **Privacy** line on `/` and `/b/{id}` that links to it.                                                                       | [010_privacy-page](features/010_privacy-page.md)                                 |
| 011 | Hero detail dialog            | Active | The per-hero surface behind a card's portrait: a roster control that switches hero without closing, the stats in the card's own treatment, the synergy partner and the pair's read-only totals, powers grouped apart from flight and applied effects, and the notes area. | [011_hero-detail-dialog](features/011_hero-detail-dialog.md)                     |
| 012 | Special powers                | Active | The display-only stat effects a trained power grants — Supernova, En Pointe, Spread Thin and Sonar's form swap — with their gating, stat math, the `sp` state they serialize into, and the single source the API validator's `special_powers` block is derived from.      | [012_special-powers](features/012_special-powers.md)                             |
| 013 | Scroll edge affordance        | Active | A shared `ScrollRegion` that marks each edge where a scrolling region is currently hiding content — per edge, not per overflow — with its tolerance and contrast floor, and `bringIntoView` for the minimum self-scroll.                                                  | [013_scroll-affordance](features/013_scroll-affordance.md)                       |
| 014 | Synergy pairs tab             | Active | The analysis view behind the "Synergy pairs" tab: one card per derived pair with both portraits, the overview's power toggles, the read-only pair total and a combined radar; portrait clicks open the detail dialog in place.                                            | [014_synergy-pairs-tab](features/014_synergy-pairs-tab.md)                       |
| 015 | Mission simulator tab         | Active | The "Mission simulator" tab: three editable mission templates, a 4-slot positional team with slot-derived power effects, the coverage + synergy + reattempt success estimate, its optional v1 build keys, and the `?tab=` URL param.                                      | [015_mission-simulator](features/015_mission-simulator.md)                       |
| 016 | Mission simulator responsive  | Active | The mission tab's reflow below the desktop design, driven by container queries on the tab itself at four thresholds down to 320px.                                                                                                                                        | [016_mission-simulator-responsive](features/016_mission-simulator-responsive.md) |
| 017 | First-run banners             | Active | Two stacked, non-blocking first-run notices at the bottom of the app shell — a spoiler warning and a browser-storage notice — each with one confirm button and its own `localStorage` acknowledgement key.                                                                | [017_first-run-banners](features/017_first-run-banners.md)                       |
| 018 | Hints and confirmations       | Active | Hover is an input capability, not a width: a hint exists only where the device can hover, and a tap on a no-hover device gets a confirmation naming what it did. Common symbols carry a label and nothing else.                                                           | [018_hints-and-confirmations](features/018_hints-and-confirmations.md)           |
| 019 | Roster follow                 | Active | The hero detail dialog's roster rail and ribbon keep the marked hero visible: a minimum scroll on open, on an app-driven hero change, and on a click that lands on a partly clipped tile.                                                                                 | [019_roster-follow](features/019_roster-follow.md)                               |
| 020 | Team swap travel              | Active | The mission team's arrow swap animates as a travel — the two slot cards move into each other's positions; empty slots, Golem copies and Prism illusions are keyed by position. Presentation only.                                                                         | [020_team-swap-travel](features/020_team-swap-travel.md)                         |
| 021 | Hero portraits                | Active | One lossless master per hero at the bust's native size, and the width each usage site renders at declared once in `HeroPortrait`; Nuxt Image serves AVIF through the Vercel provider with a derived allowed-sizes list and a one-year edge cache.                         | [021_hero-portraits](features/021_hero-portraits.md)                             |
| 022 | Hero notes                    | Active | The notes panel's content: an always-shown hero note per hero, and ten allocation-derived advisories (warnings and suggestions, one voice, declaration order), sourced from `context/game-mechanics.md`.                                                                  | [022_hero-notes](features/022_hero-notes.md)                                     |
| 023 | Initial load                  | Active | Holds `/`'s first paint back rather than covering it: while the build loads, the app draws its title, its background wash and one ring, then reveals everything at once in its final positions. `/b/**` and route transitions excluded.                                   | [023_initial-load](features/023_initial-load.md)                                 |
| 024 | Hero card transitions         | Active | On the hero card, content that comes or goes with a state change fades, a control whose glyph changes swaps it with a scale, and the chip row's neighbours travel rather than jump. Presentation only; annex §11 named patterns.                                          | [024_graceful-transitions](features/024_graceful-transitions.md)                 |
| 025 | Hero dialog transitions       | Active | The dialog's motions on a roster switch: pictures fade, figures count, and the toolbar name and the notes slide, with the stats panel holding still. Presentation only.                                                                                                   | [025_dialog-transitions](features/025_dialog-transitions.md)                     |
| 026 | Share page boot splash        | Active | Nuxt's SPA loading template for the client-only `/b/**` routes: the app's ground and the annex's loading ring from the first paint until the app mounts.                                                                                                                  | [026_share-page-boot-splash](features/026_share-page-boot-splash.md)             |
| 027 | Nuxt SEO                      | Active | `@nuxtjs/seo` site config, robots and sitemap policy (index `/` and `/privacy`, disallow `/b/**`), a `WebApplication` Schema.org node on `/`, and per-route static Open Graph images — `/b/{id}`'s via a Nitro `render:html` hook since that route is `ssr: false`.       | [027_nuxt-seo](features/027_nuxt-seo.md)                                         |

## Architecture Decision Record (ADR) Index

One line per record: type, status, title, link.

| ### | Type        | Status      | Decision                                                                        | Document                                                                                      |
| --- | ----------- | ----------- | ------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| 001 | init-design | Implemented | Brownfield adoption — confirm the de facto Nuxt/NuxtUI frontend stack           | [001_init-design_brownfield-adoption](decisions/001_init-design_brownfield-adoption.md)       |
| 002 | tooling     | Implemented | Adopt the Matt Pocock engineering skill pipeline, paths adapted into the bundle | [002_tooling_matt-pocock-skills](decisions/002_tooling_matt-pocock-skills.md)                 |
| 003 | design      | Implemented | Instantiate the design system — Dispatch-styled reskin                          | [003_design_design-system](decisions/003_design_design-system.md)                             |
| 004 | infra       | Implemented | Adopt a backend — FastAPI, Neon Postgres, Firebase identity                     | [004_infra_backend-adoption](decisions/004_infra_backend-adoption.md)                         |
| 005 | bootstrap   | Implemented | Bootstrap the FastAPI service — scaffold, health, error envelope, Alembic       | [005_bootstrap_api](decisions/005_bootstrap_api.md)                                           |
| 006 | refactor    | Implemented | Split build persistence, and settle what "build" means                          | [006_refactor_build-persistence-split](decisions/006_refactor_build-persistence-split.md)     |
| 007 | infra       | Implemented | Host on Vercel — two projects, one repository                                   | [007_infra_hosting-vercel](decisions/007_infra_hosting-vercel.md)                             |
| 008 | refactor    | Implemented | Draw the stat radar ourselves and drop vue-data-ui                              | [008_refactor_own-radar-chart](decisions/008_refactor_own-radar-chart.md)                     |
| 009 | tooling     | Implemented | Adopt the Maintenance layer — Renovate, with no automerge                       | [009_tooling_adopt-maintenance-renovate](decisions/009_tooling_adopt-maintenance-renovate.md) |

## Domain Decision Index

Present only when the project has standing cross-cutting domain/method decisions (e.g. "negative values are signal, never clipped") — pre-resolved judgment calls the agent follows and never re-litigates (`references/project-documents.md`). One line each: decision + short rationale. A local decision graduates here when it proves cross-cutting.

| Decision                                              | Rationale                                                                                                                                                                                                                                                                                                                      |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Backward compatibility is owed from 21 September 2026 | Stage 2 (decision 007) enabled sign-in on that date, so build documents now exist in accounts and in shared links. A format change from here needs a migration or a decoder for earlier shapes; it can no longer simply be made. Before that date nothing was promised in the wild, which is why earlier formats have neither. |

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
| frontend/addons | ssr, image (feature 021)                                                                                |
| frontend/ui     | nuxtui                                                                                                  |
| backend         | python-fastapi                                                                                          |
| persistence     | postgres (hosted on Neon)                                                                               |
| identity        | firebase-auth — swapped from `keycloak` by decision 004; no module document, the record is the contract |
| maintenance     | renovate — decision 009 (no automerge, weekly, both lockfiles in scope)                                 |

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
