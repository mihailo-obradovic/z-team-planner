# Decision: Adopt the Matt Pocock engineering skill pipeline

## Status

Implemented

## Type

tooling

## Task Weight

Easy

## Context

The `mattpocock-skills` plugin is installed in this environment: a pipeline of engineering skills (`to-spec` → `to-tickets` → `triage` → `implement` → `code-review`, plus `tdd`, `diagnosing-bugs`, `research`, `domain-modeling`, `grilling`) that hand work to each other. Its setup step (`/setup-matt-pocock-skills`) scaffolds a document layout of its own — `docs/agents/*.md` for config, `docs/adr/` for decisions, a root `CONTEXT.md` for the glossary — and its skills read those paths directly (`domain-modeling` and `improve-codebase-architecture` read `docs/adr/`; seven skills read `CONTEXT.md`; `code-review` and `triage` read `docs/agents/`).

Every one of those paths collides with a bundle directory that already owns the same artifact type. `references/agent-skills.md` (Third-party skill pipelines) governs the case directly and forbids creating them.

## Decision

Adopt the pipeline for its **procedures**, and refuse its **bookkeeping**.

The three config documents live inside the bundle at `agents/` — `agents/issue-tracker.md`, `agents/triage-labels.md`, `agents/domain.md`. No `docs/` directory is created, no root `CONTEXT.md`, no `docs/adr/`. A redirect table in the root `AGENTS.md`, outside the `catalyst:` markers (project-owned, never rewritten by the upgrader), maps every path a skill hardcodes onto the bundle artifact that actually governs it, and closes with the rule that Catalyst discipline wins on conflict.

The issue tracker is **Workflowy**, `Home → Work → Z-Team Planner`, reached through the `workflowy` MCP server — not GitHub Issues, despite the GitHub remote. The five canonical triage roles map onto Workflowy `#tags` under their default names.

Rejected: writing the skill's default layout as-is. It gives the project two homes for ADRs and two for domain context; the moment they disagree neither is the contract.

## Scope

`catalyst/agents/` (new, project-owned inside the bundle), the `## Agent skills` block in the root `AGENTS.md` outside the generated markers, this record, and its `project-summary.md` index row. No application code, no behavior contracts, no bundle rule documents.

## Consequences

The pipeline's procedural skills become available without the project acquiring a second governance system. Three collisions resolve in Catalyst's favour, and the redirect table records it:

- **Spec.** `to-spec` output is drafting input for `features/<nnn>_<feature>.md`, never a parallel artifact. The feature document is durable and its approval is the implementation gate.
- **Implement.** `implement` closes itself out and commits on its own; Implementing A Plan overrides that — one step at a time, the user approves every commit.
- **Issue vocabulary.** Triage labels are Workflowy tags in this project; no GitHub Issues surface is opened, and external PRs are not a request surface here.

Cost: the redirect table is a maintenance point — a plugin upgrade that adds a skill reading a new hardcoded path needs a new row. Workflowy is also a private tracker, so `triage` cannot be run by anyone but the maintainer.

## Contracts Touched

- `AGENTS.md` and `CLAUDE.md` (root, outside the `catalyst:` markers) — the `## Agent skills` block, mirrored in both because each harness reads only one of them; `CLAUDE.md` imports `catalyst/AGENTS.md`, not the root `AGENTS.md`.
- `project-summary.md` — this record's ADR index row.

## Open Questions

## Verification

`catalyst/agents/` carries the three documents; no `docs/`, no root `CONTEXT.md`, no `.scratch/` was created. The redirect table was built from a grep of what each installed skill actually hardcodes, so every assumed path has a row. `merge_marked` in the scaffolder was read to confirm an upgrade replaces only what sits between the `catalyst:` markers, leaving the appended block intact — so the redirect survives the next `upgrade_project.py --apply`. `python3 catalyst/tools/validate.py .` passes with 0 errors.
