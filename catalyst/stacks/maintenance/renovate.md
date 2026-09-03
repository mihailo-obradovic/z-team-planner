# Stack: Maintenance — Renovate

**Layer:** Maintenance (optional — not in the default set)
**Tool:** Renovate

**Trigger:** the project has a committed lockfile or pinned image tags someone must keep current — in practice, from the first deployable build onward. Adopt this layer when the trigger fires — not in anticipation; a repository with nothing pinned has nothing to bump. It names the mechanism that keeps existing pins moving; it never restates a Universal Rule. Swap it for another update bot (Dependabot, a scheduled CI job) by decision record — the rules below bind the replacement unchanged.

**Adds:** a versioned `renovate.json` at the repository root, plus the bot's platform enablement. Nothing at runtime — no library, no service, no import.

**Does not replace:** the human merge — Renovate opens PRs, a person reviews and merges them — and it is never a licence to add a dependency.

## Rules

- Renovate proposes, a human disposes: every update arrives as a PR reviewed and merged by a person on a green pipeline. Automerge is permitted only for patch/minor updates that touch the lockfile alone, and **never** for a major — a major-version move is an `upgrade` decision record (`architecture.md`), decided before the merge, not ratified after it.
- It moves existing pins; it never introduces a dependency. The Dependency Change Rule (`architecture.md`) is untouched: a Renovate PR that would add a package is closed until that gate is passed, not merged because a bot opened it.
- Lockfiles and image tags stay exact; the pin moves in a reviewed commit, never a floating range. Ranges are never widened to make the bot quieter, and stated minimums still govern — an update that crosses a minimum, drops a supported runtime, or swaps a named tool belongs to the decision record that owns that choice.
- A bump that only moves the pin, pipeline green and no documented behavior affected, is `Minor` work. The moment a bump changes behavior it is ordinary work again: feature document or decision record, its own branch, the Same-Change Rule. Green CI is evidence, never approval.
- Grouping, schedule, rate limits, managers in scope, and platform enablement (hosted app or self-hosted runner) are project decisions, recorded in the decision record that adopts this layer. `renovate.json` is versioned in the repository like any other config — never configured only in the bot's dashboard — and the bot's credentials are secrets like any other.
- A security advisory jumps the schedule: a vulnerability-driven update is triaged when it lands, not at the next grouping window.

## Approved Libraries

- Renovate (hosted app or self-hosted), plus the `renovate.json` it reads. No runtime dependency — nothing here ships in the application image.

## Avoid

- Automerging majors, or any automerge on a repository whose CI does not actually gate the merge.
- A dependency PR that also carries application changes: a bump and a fix never travel in one change.
- Blanket `ignoreDeps` or an indefinitely paused bot — a package that cannot move gets a stated reason and a revisit trigger in the adopting decision record.
