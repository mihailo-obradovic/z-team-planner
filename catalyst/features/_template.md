# Feature: <name>

This file is a behavioral contract, not an implementation diary. Keep it short, specific, and updated in the same change as behavior changes.

Expected file name: `features/<nnn>_<feature>.md`, where `<nnn>` is the next zero-padded feature number.

Size budget: target ≤9,600 characters, hard max 14,400 — total characters, since line widths are not capped. Over the max → split the feature, move exhaustive examples into tests, summarize implementation detail, or ask for an explicit exception.

## Status

Draft

One ordered lifecycle (the feature's state, and the document's gate, on a single axis — same set as `project-summary.md`):

- `Draft`: drafted, waiting for the user's review — implementation has not started.
- `Approved`: the user accepted this document as the contract; work moves to a branch and implementation may start.
- `Active`: implemented and verified against real behavior; live.
- `Changing`: being redesigned or refactored.
- `Deprecated`: kept for compatibility, not to be expanded.
- `Removed`: intentionally removed; the document stays as history.

## Task Weight

Medium

Allowed values: `Easy` / `Medium` / `Hard` — workflow per weight is defined in `prime-directive.md` (Task Classification).

## Purpose

Explain why this feature exists and which user or system problem it solves.

## Inputs

Define accepted inputs formally enough that another agent can test them.

| Input    | Type     | Source     | Constraints     |
| -------- | -------- | ---------- | --------------- |
| `<name>` | `<type>` | `<source>` | `<constraints>` |

## Outputs And Side Effects

Define produced outputs and any durable side effects.

| Output / Side Effect | Type     | Description     |
| -------------------- | -------- | --------------- |
| `<name>`             | `<type>` | `<description>` |

## Scope And Non-Goals

In scope:

- <behavior included in this feature>

Non-goals:

- <behavior intentionally excluded>

## User / System Behavior

Describe the intended behavior in concrete terms.

- When <condition>, the system should <behavior>.

## Roles And Access

When the feature introduces or changes roles or permissions (prime directive: roles are a first-class contract dimension), include both:

- an access matrix — resource/action × role;
- a per-role experience walkthrough — what each account type sees at entry and which sections and actions it gets.

Otherwise state: `Not role-specific.`

## Examples

Use examples where behavior depends on input; they are the acceptance criteria.

| Input     | Expected Output | Notes                   |
| --------- | --------------- | ----------------------- |
| `<input>` | `<output>`      | `<important condition>` |

## Business Rules

- <rule that must be enforced — including non-functional limits when they matter (volume, latency, retention)>

## Edge Cases

- <edge case and expected behavior>

## Invariants

These must remain true after future changes:

- <invariant>

## Error Handling

- <expected error case and system response>

## Entry Points

Public surface or primary execution path:

- `<path/to/code>`: <what it is and why it matters>

## Dependencies

Other features, services, modules, external systems, or data contracts this feature depends on:

- `<dependency>`: <why it matters>

## Open Questions

Unresolved items live here while the document is a draft. This section MUST be empty at approval: resolve each question or move it to Non-Goals. Exception: a retro-documented (brownfield) contract may keep deliberate long-horizon questions past approval when the user explicitly chooses to — record that choice here (`workflows/brownfield.md`).

- <open question>

## Tests

Required test cases and where they live:

- `<path/to/test>`: <cases it must prove>

## Verification

The evidence, not the plan (Tests above is the plan). Filled at implementation, before the status flips to `Active`: what actually ran and what it showed, 2–5 lines — commands/suites and results, live walks (browser, stack) and what they proved, and any remaining risks. Empty while the document is a draft.

## Agent Change Rules

Before changing this feature, an agent must:

1. Read this feature document.
2. Identify which documented behavior or invariant is affected.
3. Confirm the Status is `Approved` (or later), or ask the user to approve the document first.
4. Add or update tests for the changed behavior.
5. Update this document in the same change if the intended behavior changes.
6. Update `project-summary.md` if the feature summary or status changes.
