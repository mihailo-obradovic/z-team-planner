# Decision: Hold Python at 3.14 until Vercel runs 3.15

## Status

Implemented

## Type

tooling

## Task Weight

Easy

## Context

The API runs as a Vercel Python service (decision 012), and Vercel's Python runtime offers 3.12, 3.13 and 3.14. Renovate (decision 009) proposed Python 3.15 in its grouped minor/patch PR: `.python-version` to `3.15`, `requires-python` to `>=3.15.2`, and a `uv.lock` resolved for 3.15 alone. CI passed on it, because CI installs whatever `.python-version` names. A deploy would not: Vercel cannot build an API that requires an interpreter it does not have.

The grouping makes this easy to miss. The bump sat among twenty library updates in one green PR, and merging that PR would have taken the API down.

## Decision

A `packageRules` entry in `renovate.json` caps `python` at `<3.15`, with its reason in the rule's `description`. It covers every place Renovate reads the version: `.python-version`, `requires-python`, and the lockfile header.

A second rule sets `rangeStrategy: replace` for `requires-python`, so Renovate stops raising its floor to each new patch (`>=3.14` → `>=3.14.10`). Vercel decides which 3.14 patch the API runs, and a floor above it fails the deploy the same way 3.15 would. The floor moves only together with `.python-version`, by hand.

Rejected: leaving it to review. The same bump will return every week inside the grouped PR, and nothing in that PR says the deploy target cannot run it.

## Scope

`renovate.json` only. No dependency, no application code, no behavior contract.

## Consequences

Renovate stops proposing Python 3.15 or a higher patch floor, and the grouped PR no longer carries an undeployable change.

Revisit trigger: Vercel's Python runtime lists 3.15. Then remove the rule and move `.python-version`, `requires-python` and `uv.lock` together in one reviewed change.

## Contracts Touched

- `project-summary.md`: ADR Index row.

## Open Questions

## Verification

`renovate.json` validates against its schema with `npx --yes --package renovate -- renovate-config-validator`. The two rules are the only Python changes to the file.
