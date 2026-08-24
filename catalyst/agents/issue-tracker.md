# Issue tracker: Workflowy

Issues, backlog items, and notes for this repo live in **Workflowy**, under `Home → Work → Z-Team Planner` (node `7fd2774f-b8f0-dbba-9910-5e945c2e8757`). They are not tracked in GitHub Issues, despite the GitHub remote — that remote is for code, releases, and CI only.

Access is through the `workflowy` MCP server (`workflowy_get`, `workflowy_search`, `workflowy_create`, `workflowy_update`, `workflowy_move`, `workflowy_complete`). There is no CLI and no `gh issue` equivalent.

## Layout

| Node               | Holds                                                                             |
| ------------------ | --------------------------------------------------------------------------------- |
| `Backlog`          | Not-yet-started work. `GitHub` groups repo-infrastructure items (CI, Renovate, …) |
| _(loose children)_ | In-flight or unsorted items sitting directly under `Z-Team Planner`               |
| `Notes`            | Observations and open game-balance questions — not actionable tickets             |
| `Archive`          | Completed work, kept for history                                                  |

An item is **open** when `completedAt` is null. Completing an item (`workflowy_complete`) is how work is closed; finished items may then be moved under `Archive`.

## When a skill says "publish to the issue tracker"

`workflowy_create` a child of `Backlog` (or of the topical sub-node, e.g. `GitHub`). Put the one-line title in the node name and any body in the node's note. Add the triage tag to the name per `triage-labels.md`.

## When a skill says "fetch the relevant ticket"

`workflowy_search` the `Z-Team Planner` subtree by title, or `workflowy_get` a node id directly. The user will normally name the item in prose rather than by id.

## Not a request surface

This tracker is private to the maintainer. External pull requests are **not** part of the triage queue; a PR on the GitHub remote is reviewed as code (`/code-review`), never routed through `/triage`.

## The tracker is the maintainer's, not the agent's

Workflowy is maintained by hand. It drifts behind the repo — items finished in code
are not always completed there — and that is expected, not a defect to go and fix.

- **Never complete, move, or delete an item on your own initiative.** Closing work is
  the maintainer's call.
- **Never treat the tracker as authoritative for "what is left".** `catalyst/project-summary.md`
  and the feature documents are the contract; Workflowy is a working list beside them.
- The maintainer says per task what to add, update, ignore, or mark done. Act on that
  instruction; do not infer it from the diff.

Writing a _new_ item (`workflowy_create`) when a skill publishes a ticket is fine — that
adds to the list rather than editing the maintainer's judgment about it.
