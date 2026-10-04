# Decision: Version the product itself, starting at 0.1.0

## Status

Proposed

## Type

tooling

## Task Weight

Easy

## Context

The planner and the API have been live since stage 2 (21 September 2026), and every push to `master` deploys both. Nothing names what is deployed. The repository has no tags. `package.json` says `v0.0.1`, while `pyproject.toml` and the API's own metadata each hardcode `0.1.0` separately. When something breaks on the live site, there is no way to say which release it is on, or what changed since the last one.

Catalyst's `versioning.md` describes how a project versions itself: a root `VERSION`, release notes, and two hooks that tag a release commit.

## Decision

- **`VERSION` at the repository root is the one source of the number**, starting at `0.1.0`. `package.json` and `pyproject.toml` carry the same string and are kept in step by hand. A check script waits until they actually drift once.
- **The API reads `VERSION` at import** into its metadata, the same way it finds `shared/`. A missing file aborts startup, because a deploy without it is a broken deploy. `/healthz` gains a `version` field. It reads a constant, so it still touches nothing.
- **One `CHANGELOG.md`**, in Keep a Changelog layout and the release-notes shape `versioning.md` asks for: per release a version, date, short Overview, then Added / Changed / Fixed, plus a **Database** line naming the migration whenever a release changes the schema. Its readers are the players on the live site and the maintainer as operator, so one file serves both. `Unreleased` gathers only what a player or the operator would notice. Dependency bumps get no line unless they change behavior or the schema.
- **`0.1.0` describes the live product as it stands**, in one Overview paragraph. No history is reconstructed from the 571 commits before it.
- **A release is a deliberate act by the maintainer.** It is never implied by a merge. Below `1.0.0`, MINOR marks a new user-facing capability and PATCH marks fixes and polish. `1.0.0` comes when the maintainer declares it.
- **The `post-commit` and `post-merge` hooks** come into `catalyst/tools/hooks/` from the template unchanged. The maintainer activates them, and they tag `v<VERSION>` on `master`. Tags are pushed. No GitHub Releases: nobody reads that page, and it would be a second copy of the changelog.
- **The version shows in the API only.** Showing it in the frontend is a design question and its own ticket.

Rejected: a version per merge, which makes a one-line fix and a whole feature look the same; separate changelog and release-notes files, which drift apart with one maintainer; `semantic-release` and Conventional Commits, which `versioning.md` reserves for projects whose history a tool reads.

## Scope

New `VERSION`, `CHANGELOG.md`, `catalyst/tools/hooks/post-commit` and `post-merge`. `package.json`, `pyproject.toml`, `app/main.py`, `app/routes/health.py` and their tests. No behavior contract for players changes. The ops endpoint's body grows by one field.

## Consequences

Better: an incident can name its release from one `curl` of `/healthz`. The first public release reads straight off `Unreleased` instead of being reconstructed.

Harder: three files carry the number, and a release must touch all three.

If decision 012 moves the API into a subdirectory, the `VERSION` reader moves with the `shared/` readers.

`versioning.md` names the file `release-notes.md`, while the template's spawn writes `CHANGELOG.md` and the prime directive says "changelog". This project uses `CHANGELOG.md`. The contradiction is recorded in the Catalyst repository's `TODO.md` for a template fix.

## Contracts Touched

- `operations.md`: API service (Releasing, and the `version` field on `/healthz`).
- `app/CLAUDE.md`: the `/healthz` body.
- `project-summary.md`: the ADR index.

## Open Questions

## Verification
