# Domain Docs

How the engineering skills consume this repo's domain documentation. This project runs on Catalyst, so the paths the skills name upstream do not exist here — the artifacts do, under `catalyst/`.

## Before exploring, read these

- **`catalyst/project-summary.md`** — the index: purpose, Feature Index, ADR Index, Protected Areas, Technical Stack. This is the entry point, and it routes to everything below.
- **`catalyst/context/product-description.md`** — what the product is for and its phases.
- **`catalyst/context/glossary.md`** — the application's own vocabulary: what a build document, local build, cloud build and shared build each are, and the planner terms around them. The glossary for anything the project invented.
- **`catalyst/context/game-mechanics.md`** — the Dispatch reference every hero stat, power, and synergy rule is transcribed from. The glossary for anything the _game_ defines.
- **`catalyst/features/<nnn>_<feature>.md`** — the behavioral contracts. Read the ones the Feature Index points at for your area.
- **`catalyst/decisions/<nnn>_<type>_<decision>.md`** — the ADRs. Read the ones touching the area you're about to work in.

Layout is **single-context** — one project, one bundle, no `CONTEXT-MAP.md` and no per-package contexts.

## Path redirects

| Upstream skill path | Read/write here instead                             |
| ------------------- | --------------------------------------------------- |
| `CONTEXT.md`        | `catalyst/context/` + `catalyst/project-summary.md` |
| `CONTEXT-MAP.md`    | does not apply — single-context                     |
| `docs/adr/`         | `catalyst/decisions/`                               |
| `docs/agents/`      | `catalyst/agents/` (this directory)                 |
| `.scratch/`         | does not apply — the tracker is Workflowy           |

Never create the upstream directories. Two homes for one artifact type means neither is the contract (`catalyst/references/agent-skills.md`, Third-party skill pipelines).

## Writing domain docs

`/domain-modeling` creates glossary entries and ADRs lazily, as terms and decisions get resolved. Here that means:

- A resolved **term** goes into the relevant `catalyst/context/` document, in that document's own shape — `glossary.md` for anything the project defines, `game-mechanics.md` for anything the game does (see below).
- A resolved **decision** goes through the Catalyst ADR flow — `catalyst/decisions/_template.md`, next free number, `Proposed` → user approval → `Accepted`, with a row in the ADR Index. It is never a bare file dropped in a directory.

## Use the glossary's vocabulary

When output names a domain concept — an issue title, a refactor proposal, a test name — use the defined term.

Two documents hold vocabulary, split by who owns the word, so there is exactly one home for any given term:

- **The game defines it** → `catalyst/context/game-mechanics.md`. Heroes, stats, powers, synergy, dispatching. That document is a transcription and the game is upstream of it, so a term is never coined there. Hero ids and game data are a protected area (`catalyst/features/002_hero-data.md`); renaming one in code is never incidental.
- **The project defines it** → `catalyst/context/glossary.md`. Builds, the planner, its modes — concepts that exist in this app and nowhere in Dispatch. A term resolved during `/domain-modeling` lands here unless the game already owns it.

If a term seems to belong to both, it belongs to the game, and the glossary points at it rather than restating it.

## Flag ADR conflicts

If output contradicts an existing record, surface it rather than silently overriding:

> _Contradicts decision 001 (brownfield adoption of the de facto stack) — but worth reopening because…_

A record that is `Implemented` is history: revisit it with a new record marked `Superseded by <nnn>`, never by rewriting it.
