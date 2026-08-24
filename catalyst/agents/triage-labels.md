# Triage Labels

The skills speak in terms of five canonical triage roles. Workflowy has no label field, so a role is carried as a **`#tag` appended to the item's name**. Tags are searchable (`workflowy_search`) and filterable in the Workflowy UI.

| Label in mattpocock/skills | Label in our tracker | Meaning                                  |
| -------------------------- | -------------------- | ---------------------------------------- |
| `needs-triage`             | `#needs-triage`      | Maintainer needs to evaluate this issue  |
| `needs-info`               | `#needs-info`        | Waiting on reporter for more information |
| `ready-for-agent`          | `#ready-for-agent`   | Fully specified, ready for an AFK agent  |
| `ready-for-human`          | `#ready-for-human`   | Requires human implementation            |
| `wontfix`                  | `#wontfix`           | Will not be actioned                     |

Applying a role means `workflowy_update` on the node name: `Mission simulator tab #ready-for-agent`. Exactly one role tag per item — replace the old tag, never stack two.

An item carrying no tag has not been triaged; treat it as `#needs-triage` without writing the tag until triage actually runs.

`#wontfix` items are completed (`workflowy_complete`) rather than left open, so the tag survives in `Archive` as the reason.
