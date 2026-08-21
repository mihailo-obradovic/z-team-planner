# Workflow: Brownfield Adoption

**Trigger:** adopting the prime directive on an existing codebase. Documents are written from observed behavior, never from intention.

The locked invariant is in the Flow Index (`prime-directive.md`).

## Steps

1. Architecture: run Init Design (`workflows/init-design.md`) against the running system — confirm or record the de facto stack in the umbrella record. Where the repo already has convention documents, link them instead of rewriting them. Adapt the entry documents; the user reviews them first — they are the frame every contract is written against. Existing source directories that a bundle document governs get folder-document pointer lines into `catalyst/` during adoption, the same seeding a bootstrap does (`workflows/bootstrap.md` step 5); an existing folder document gains the pointer lines and keeps its own content.
2. Protected Areas derive from what already ships — contracts that external systems, published artifacts, or persisted data depend on.
3. Retro-document features one at a time: agree an inventory of load-bearing areas with the user, ordered by breakage cost; contract those first and document the rest on touch — the first time a task lands there. Each contract is written from code, tests, and live behavior; honest gaps (missing tests, unverified paths) are recorded, not smoothed over.
4. A retro-documented feature is `Active` on creation — it already ships; the user's review checks the document against real behavior rather than gating an implementation that has not happened. Backfilled decision records state in Context that they are backfilled, with the original decision date when known, and go straight to `Implemented`. Backfill only decisions that still matter — skip choices fully carried by an `architecture.md` line.
5. A retro-documented contract may keep deliberate long-horizon Open Questions past approval when the user explicitly chooses to (record that choice in the section) — brownfield-only; drafts of new work still resolve or move every question before approval. Current content state (which items exist today) never goes into a contract.
