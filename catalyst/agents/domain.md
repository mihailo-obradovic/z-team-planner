# Domain Docs

How the engineering skills consume this repo's domain documentation. This project runs on Catalyst, so the paths the skills name upstream do not exist here — the artifacts do, under `catalyst/`.

## Before exploring, read these

- **`catalyst/project-summary.md`** — the index: purpose, Feature Index, ADR Index, Protected Areas, Technical Stack. This is the entry point, and it routes to everything below.
- **`catalyst/context/product-description.md`** — what the product is for and its phases.
- **`catalyst/context/game-mechanics.md`** — the Dispatch reference every hero stat, power, and synergy rule is transcribed from. This is the domain glossary: it defines the vocabulary.
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

- A resolved **term** goes into the relevant `catalyst/context/` document, in that document's own shape.
- A resolved **decision** goes through the Catalyst ADR flow — `catalyst/decisions/_template.md`, next free number, `Proposed` → user approval → `Accepted`, with a row in the ADR Index. It is never a bare file dropped in a directory.

## Use the glossary's vocabulary

When output names a domain concept — an issue title, a refactor proposal, a test name — use the term as `catalyst/context/game-mechanics.md` defines it. Hero ids and game data are a protected area (`catalyst/features/002_hero-data.md`); renaming a term in code is never incidental.

## Flag ADR conflicts

If output contradicts an existing record, surface it rather than silently overriding:

> _Contradicts decision 001 (brownfield adoption of the de facto stack) — but worth reopening because…_

A record that is `Implemented` is history: revisit it with a new record marked `Superseded by <nnn>`, never by rewriting it.
