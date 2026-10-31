# Decision: From 1.0.0, the major version is the game's season

## Status

Accepted

## Type

tooling

## Task Weight

Easy

## Context

Decision 013 started the product at `0.1.0`, defined MINOR and PATCH below `1.0.0`, and left `1.0.0` for the maintainer to declare. The maintainer declares it with the release that carries the October 2026 security updates. Nothing yet says what the numbers mean above it.

Plain Semantic Versioning ties MAJOR to a broken contract. This product has few contracts a player can break into: saved builds, share links and `/api/v1`, all of which are kept working. What does change the planner wholesale is the game. Every hero, power and synergy pair is transcribed from Dispatch (`context/game-mechanics.md`), and a new season reshapes all of them.

## Decision

From `1.0.0` on:

- **MAJOR is the game's season.** `1.x` plans Dispatch's first season, and `2.0.0` is the release that takes on the second season or a story DLC of that scale. A break of saved builds, share links or `/api/v1` would also be a MAJOR, but none is expected.
- **MINOR** is a smaller game update the planner follows (stats rebalanced, a hero or power added) or a new capability a player can see.
- **PATCH** is fixes, polish, security updates, and corrections where the transcribed game data disagreed with the game.

Decision 013 otherwise stands: `VERSION` is the one source, a release is the maintainer's deliberate act, and `CHANGELOG.md` gathers what a player or the operator would notice.

Rejected: MAJOR for compatibility breaks alone. It would leave the product on `1.x` through every future season, and the number would say nothing a player cares about.

## Scope

`operations.md` (Releases: what each number means). No code, no dependency, no behavior contract.

## Consequences

A player can read the season the planner covers off the version number. A compatibility break inside a season would push MAJOR ahead of the season count, which is one more reason not to make one.

## Contracts Touched

- `operations.md`: Releases.
- `project-summary.md`: ADR Index row.

## Open Questions

## Verification

`1.0.0` is cut under this rule: `VERSION`, `package.json`, `pyproject.toml` and `uv.lock` agree, the tag `v1.0.0` is pushed, and the live `/healthz` reports `1.0.0`.
