# Decision: Record the schema revision in the backup manifest

## Status

Accepted

## Type

infra

## Task Weight

Easy

## Context

The backup manifest holds a row count for every table in `public`, so `alembic_version` shows up as `"alembic_version": 1` and never as the revision id. The manifest's `reason` and `taken_at` say why and when a dump was taken. Nothing says what schema it holds.

During a recovery, the revision is the direct way to tell a pre-migration dump from a post-migration one. The restore drill can compare row counts, but it cannot confirm that the schema came back at the expected revision.

## Decision

The manifest gains a top-level `revision` field: `version_num` from `alembic_version`, as a string. The job fails unless that table holds exactly one row. This replaces the current check, which only requires the table to exist. History is linear and `migrate.yml` only ever upgrades to `head`, so zero rows or several rows means something is wrong. That should stop the run instead of being written down. An array that records whatever is there, or a `null` that lets the run pass, would both hide that failure.

The census keeps `alembic_version` among its tables. It covers every table in `public` and is compared as a whole, so taking one table out would add a special case to both the census and the comparison.

Recovery still chooses the dump by `reason` and `taken_at`. The revision then confirms the choice: it must match the "revision before" line in that migration run's log. The restore drill adds one check: the restored branch's `version_num` must equal the manifest's `revision`.

Existing manifests are not backfilled. They lack the field and are all pruned within the 30-day retention.

## Scope

`.github/workflows/backup.yml` (the Write the manifest step) and `catalyst/operations.md` (Backups and Neon Recovery). No application code, no feature document, no behavior contract.

## Consequences

Better: a manifest says which schema its dump holds, so a recovery can check that it chose the right dump, and the drill can check that the schema came back.

Riskier: a stricter check means more ways for a nightly run to fail. Each one is a database that `migrate.yml` would also refuse to work with, so a red run is the correct result.

## Contracts Touched

- `catalyst/operations.md`: Neon Postgres → Recovery (choosing the dump and the drill's check), and Backups (Operate's manifest description, and Quirks' guard).
- `project-summary.md`: the ADR index.

## Open Questions

## Verification

The step's SQL ran against a scratch branch of production (`verify-010-manifest-revision`). The census reported `alembic_version: 1`, and the revision read `182ad318ac94`. With a second row inserted, the census reported 2; with the table emptied, it reported 0. The step's guard, run on those census shapes and on one with the table missing, passes only the single-row case.

Dispatched run 36976597881 from the branch passed and wrote `ztp-2026-10-02T070403Z`. Its manifest has `"revision": "182ad318ac94"`, which is production's `version_num`. The scratch branch has been deleted. Still to be proven by the next real migration: a `pre-migration` manifest whose revision matches that run's "revision before".
