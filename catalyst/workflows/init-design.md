# Workflow: Init Design

**Trigger:** once at project start, or when an existing system is first brought under the prime directive.

The locked invariant is in the Flow Index (`prime-directive.md`); this file is the how.

## Steps

1. Input: read the project's `context/` documents (e.g. `context/product-description.md`) when they exist; otherwise interview the user first — data, load, integrations, users, constraints. Never judge triggers blind.
2. Stack: walk the Stack Modules table (`architecture.md`) layer by layer and pick one module per layer, plus any of its addons the input justifies (e.g. the `ssr` addon for an SEO-driven site). Record the chosen set in the project's Technical Stack table (`project-summary.md`); every deviation from the default is a swap noted in the record.
3. Outcome: one umbrella record, `decisions/<nnn>_init-design_<slug>.md` — the chosen stack modules and any swaps, open questions — run through the Decision Record workflow; nothing is built before approval. It covers day zero only: a trigger firing later gets its own adoption record. Bootstrap follows as its own record (`workflows/bootstrap.md`); the init-design record flips to `Implemented` once the designed skeleton exists.

Worked sample: `examples/decisions/002_init-design_telemetry.md`.
