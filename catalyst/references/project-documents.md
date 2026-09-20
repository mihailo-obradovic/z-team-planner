# Project-Owned Documents

**Trigger:** writing, changing, or adopting one of the documents a project keeps for itself beside its feature and decision records — a `context/` document, a convention annex under `annexes/`, the Domain Decisions register, `KNOWN_FAKES.md`, or `operations.md`. Each section below opens with when it applies; a project without the document skips its section entirely.

The template ships the rules and, where one exists, a stub or a worked sample; the documents themselves are the project's own, written inside the bundle and never overwritten by an upgrade.

## Context Documents

**When:** working on, or adding, a `context/` document — and, at spawn, choosing which to include. A project carries only the context documents it opted into; a project with none has no `context/` directory.

Context documents are optional, project-chosen background docs in `context/` that add depth behind the one-paragraph purpose in `project-summary.md`. Each is loaded on demand, only when the kind of work in progress calls for it — never preloaded.

- **Background, never a contract.** A context document records vision and intent, not behavior. When it disagrees with a feature document or `architecture.md`, the contract wins and the context document is updated to catch up. When scope or identity changes, update the context document and the `project-summary.md` purpose paragraph together (Same-Change Rule).
- **Loads by trigger, gated on presence.** A context document loads when it exists in the project _and_ the task matches its declared trigger (below). A document the project never opted into simply never loads. Which ones a project carries is its `Context documents:` line in `project-summary.md`, written at spawn — read it instead of stating `context/`.
- **Keep it scannable.** No hard character budget, but a context document earns its routine load only by staying short — trim to what shapes decisions, link out for the rest.
- **Project-owned once filled in — upgraded by sidecar.** From spawn onward the document's content is the project's; the upgrader never writes into it. When the template's stub improves, the upgrade delivers the new stub as `context/<name>.md.catalyst-new` beside the project's copy — fold in what applies, then delete the sidecar.

## Catalog

The registry of context documents: the scaffold default (whether a spawn includes it unless told otherwise) and the load trigger. The `CONTEXT_DOCS` list in `tools/new_project.py` mirrors this table — keep the two in parity.

| Document              | Scaffold default | Loads when                                                                                                                                                                                                                                                                                                                                      |
| --------------------- | ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `product-description` | on               | Product-shaping work — drafting or estimating a feature document, a product-motivated decision record, Init Design input-gathering, brownfield prioritization, an experiment's Success Bar or graduation, or any task touching product scope, phases, or priorities. Not Minor edits, Incident stabilization, Bootstrap, or Parallel execution. |
| `brand-description`   | off              | User-facing design work once the file is kept — UI feature drafting and browser verification, a frontend/UX decision record, the Init Design UI-module choice, or copy/voice/tone work.                                                                                                                                                         |
| `glossary`            | off              | Naming work — coining a term in a contract, renaming one, or settling what an existing word covers; and when a task's vocabulary is ambiguous enough that guessing would put two names on one thing                                                                                                                                             |

`brand-description` is worth keeping only when the product must align to a **shared brand it does not own** — one of several products under an umbrella company or brand whose voice and visual identity its UI has to match. A standalone application's design system (`stacks/frontend/*`) is the whole brand. Default off; opt in at spawn for portfolio products.

## Adding a context document

A document **the template ships**, offered to every spawn — three edits, kept in parity by validator R8:

1. Write the template stub at `templates/<name>.md` — a background reminder and its one-line load trigger in the header.
2. Add a row to the Catalog above (scaffold default + trigger). The Catalog is the registry; `prime-directive.md` points at a project's own list rather than naming documents.
3. Add it to `CONTEXT_DOCS` in `tools/new_project.py` so the spawn offers it.

A document **a project invents for itself** needs none of that, and never edits a template-owned file: write it under `context/`, then add it to the Context documents line in `project-summary.md` with its trigger. The Catalog above stays template-only, which is what keeps the invariant that the template never references a file the repository lacks true by construction.

Worked samples: `examples/context/product-description.md`, `examples/context/brand-description.md`.

## Convention Annexes

**When:** a repository that keeps deep, cross-cutting convention guides (styling system, framework rules, type conventions) that belong to no single folder. Most projects have none.

These are the project's own, written by it and never upgraded — distinct from Catalyst's `conventions/` (`architecture.md`, Conventions). They live as annexes owned and indexed by `architecture.md`, lazy-loaded like folder documents, with their load triggers listed on the Convention annexes line in `project-summary.md`. A convention change updates the annex, not the index. On conflict: feature contracts and `architecture.md` win over annexes; annexes win over generic tool or skill guidance (`references/agent-skills.md`, Precedence). Annexes never carry workflow rules or behavior contracts.

## Domain Decisions

**When:** a project with standing, cross-cutting judgment calls about the problem or method that the agent follows and does not re-litigate — most common in research, modeling, and analytics work. Present only when the project has such decisions.

Standing decisions like "negative values are signal, never clipped", "walk-forward evaluation only". Distinct from decision records (architectural _why_, lazy-loaded) and Protected Areas (load-bearing _contracts_): a domain decision is a locked _stance_.

- A decision local to one feature or experiment lives in that document and needs no register. It graduates to the `Domain Decisions` register in `project-summary.md` when it proves cross-cutting — governing work beyond its origin.
- The register is always-in-context (startup, via `project-summary.md`) so a locked decision stays visible; each row is the decision plus a short rationale, never buried in a lazy-loaded document.
- Changing a registered domain decision is a deliberate, user-approved act (it invalidates work that assumed it), recorded like any contract change.

## Known Fakes Register

**When:** a project carrying placeholder or synthetic data (Honest Inputs, `prime-directive.md`). A project with no fabricated data has no `KNOWN_FAKES.md` and skips this entirely.

Such a project carries `KNOWN_FAKES.md` — the register of every fabricated input still in the tree. One file per project, one table row per fake: **What** (the fake and where it lives, including where its loud runtime flag is emitted), **Why** (why real data was unavailable), **Removal** (how it is replaced and what unblocks that — a concrete condition, never "later").

- Introducing, changing, or removing a fake updates its row in the same change (Same-Change Rule); the flag is deleted together with the fake.
- Delete the file with the last row — an empty register misreads as attestation. Absence is the healthy state, and the validator errors on a register with no rows.
- Never a rules document: contracts stay in `architecture.md` and feature documents; this file only inventories what is currently fake.

Worked sample: `examples/KNOWN_FAKES.md`.

## Operations Runbook

**When:** anything an operator runs, recovers, or must be warned about — stateful components (broker, database, cache, IdP), the hosting the project is deployed on, and scheduled jobs. A project with none of those skips this entirely, which in practice means one that is not deployed anywhere.

Such a project carries `operations.md` — the operator's document: how to run what is already built. One file per project, one section per component, three parts each: **Operate** (inspection commands, ready to paste), **Recovery** (the drill, step by step, with the date it was last actually performed), **Quirks** (traps that already bit someone).

- Infra work that introduces or changes a stateful component updates its runbook section in the same change (Same-Change Rule). The decision record keeps the why and the verification evidence; the commands live here.
- The tested-restore rule (`architecture.md`, Persistence) reports here: the restore procedure's home is the component's Recovery part.
- **A stateless component still gets a section.** Its Recovery part names the rollback and points at the stateful component's drill rather than being left out — "roll back by promoting an earlier deployment; there is nothing here to restore, data recovery is the database section's drill". Omitting it reads as an operator's gap, not as an absence of state.
- **The document opens with a status note** saying what is and is not deployed. A runbook for infrastructure that does not exist yet is dangerous unless it says so, and the note is what converts a formatting artifact into named debt: **a recovery drill marked _never_ is a debt that comes due before the first real user's data lands.**
- Never rules or contracts — those live in `architecture.md` and feature documents. Commands, procedures, and quirks only.

Worked sample: `examples/operations.md`.
