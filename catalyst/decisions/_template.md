# Decision: <title>

An architectural decision record (ADR) documents architecturally significant work that does NOT change behavior contracts. It records the why and the outcome; the rules themselves live in `architecture.md`, feature and folder documents.

Size budget: target ≤4,800 characters — total characters, since line widths are not capped.

Expected file name: `decisions/<nnn>_<type>_<decision>.md` (own numbering). An `Implemented` record is history — to revisit the decision, write a new record and mark this one `Superseded by <nnn>`; do not rewrite it.

## Status

Proposed

Allowed values: `Proposed` (waiting for user review — no implementation yet), `Accepted` (user approved; implementation may start), `Implemented` (done and verified), `Superseded by <nnn>`.

## Type

<infra | refactor | perf | upgrade | security | tooling | bootstrap | init-design | incident | ...>

Free label — pick the closest. `init-design` is the day-zero umbrella (base stack confirmed or swapped, see `workflows/init-design.md`); `incident` records a production fire: what broke, what stabilized it, what debt remains (see `workflows/incident.md`).

## Task Weight

Medium

Allowed values: `Easy` / `Medium` / `Hard` — workflow per weight is defined in `prime-directive.md` (Task Classification).

## Context

Why this work is needed: the problem, constraint, or rule that prompted it.

## Decision

What was decided and the shape of the solution, in a few sentences. Name the alternative(s) rejected only when the choice was genuinely contested.

## Scope

Services, layers, or files the work touches. Behavior contracts must stay untouched — if one would change, this is feature work instead.

## Consequences

What becomes better, what gets riskier or harder, and any follow-ups this creates.

## Contracts Touched

Pointers to documents updated in the same change (`architecture.md` sections, folder `CLAUDE.md`s, feature docs). Never restate their content. Operational commands and recovery drills land in the project's `operations.md` (`references/operations-runbook.md`), updated in the same change — never inline here; this record keeps the why, the runbook keeps the how-to-run.

## Open Questions

Unresolved items live here while the record is `Proposed`. This section MUST be empty at approval: resolve each question or fold it into Consequences.

- <open question>

## Verification

How the work was proven: tests added, smoke checks run, observable evidence.
