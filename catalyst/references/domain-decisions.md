# Domain Decisions

**Trigger:** a project with standing, cross-cutting judgment calls about the problem or method that the agent follows and does not re-litigate — most common in research, modeling, and analytics work. Present only when the project has such decisions.

Standing decisions like "negative values are signal, never clipped", "walk-forward evaluation only". Distinct from decision records (architectural _why_, lazy-loaded) and Protected Areas (load-bearing _contracts_): a domain decision is a locked _stance_.

- A decision local to one feature or experiment lives in that document and needs no register. It graduates to the `Domain Decisions` register in `project-summary.md` when it proves cross-cutting — governing work beyond its origin.
- The register is always-in-context (startup, via `project-summary.md`) so a locked decision stays visible; each row is the decision plus a short rationale, never buried in a lazy-loaded document.
- Changing a registered domain decision is a deliberate, user-approved act (it invalidates work that assumed it), recorded like any contract change.
