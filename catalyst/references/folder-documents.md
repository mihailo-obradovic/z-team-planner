# Folder-Scoped Documents

**Trigger:** a distinct subsystem (backend service, frontend app, worker) that has grown enough to need its own orientation map. Not for small folders.

Such a subsystem may carry its own `CLAUDE.md`/`AGENTS.md`: a 40–80 line orientation map — what the folder is and its stack, structure, local conventions, data flow, local invariants and protected areas, entry points. Never global rules, stack-wide policy, or feature contracts. Where a bundle document governs the folder (component naming, type placement, catalog hygiene, …), the folder document carries a pointer line into `catalyst/` rather than restating the rules — seeded at bootstrap or brownfield adoption (`workflows/bootstrap.md` step 5). Keep its entry points and protected areas in sync in the same change. Protections declared in a folder document are not indexed in `project-summary.md`; the document is in context whenever its folder is worked on.

Worked sample: `examples/backend/CLAUDE.md`.
