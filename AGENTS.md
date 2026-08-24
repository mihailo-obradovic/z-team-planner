<!-- catalyst:begin -->

## Catalyst

Agent guidance for this repository lives in `catalyst/`. Read `catalyst/AGENTS.md` first — it is the file index and says which documents load when.

Mandatory on every task: `catalyst/prime-directive.md`, `catalyst/architecture.md`, `catalyst/project-summary.md`.

Paths inside those documents are relative to `catalyst/`, not to this root.

This block is generated — edit `catalyst/AGENTS.md` instead. Anything outside the markers is yours and is never touched.
<!-- catalyst:end -->

## Agent skills

Installed pipeline: `mattpocock-skills`. Its assumed paths are redirected into the bundle — see `catalyst/agents/domain.md` for the full table. On any conflict, Catalyst discipline wins: the feature document or decision record is the contract and its approval is the implementation gate, and no step is committed without the user's approval.

Adopted by [decision 002](catalyst/decisions/002_tooling_matt-pocock-skills.md).

### Issue tracker

Workflowy, `Home → Work → Z-Team Planner`, via the `workflowy` MCP server — not GitHub Issues. Maintained by hand; agents add items but never close them. See `catalyst/agents/issue-tracker.md`.

### Triage labels

The five canonical roles as Workflowy `#tags`, under their default names. See `catalyst/agents/triage-labels.md`.

### Domain docs

Single-context: glossary in `catalyst/context/`, ADRs in `catalyst/decisions/`, specs in `catalyst/features/`. No `docs/`, no root `CONTEXT.md`. See `catalyst/agents/domain.md`.
