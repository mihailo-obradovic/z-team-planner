# Context Documents

**Trigger:** working on, or adding, a `context/` document — and, at spawn, choosing which to include. A project carries only the context documents it opted into; a project with none has no `context/` directory.

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

`brand-description` is worth keeping only when the product must align to a **shared brand it does not own** — one of several products under an umbrella company or brand whose voice and visual identity its UI has to match. A standalone application's design system (`stacks/frontend/*`) is the whole brand. Default off; opt in at spawn for portfolio products.

## Adding a context document

1. Write the template stub at `templates/<name>.md` — a background reminder and its one-line load trigger in the header.
2. Add a row to the Catalog above (scaffold default + trigger).
3. Add its load-trigger bullet to `prime-directive.md` (Context Loading).
4. Add it to `CONTEXT_DOCS` in `tools/new_project.py` so the spawn offers it.

Worked samples: `examples/context/product-description.md`, `examples/context/brand-description.md`.
