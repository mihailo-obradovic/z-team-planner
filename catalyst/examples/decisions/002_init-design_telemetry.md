# Decision: Init design — field-sensor telemetry service

Standalone reference sample for a _different_ fictional project from the QA
platform the other examples share: a field-sensor telemetry service.

## Status

Implemented

## Type

init-design

## Task Weight

Medium

## Context

New project: field devices report sensor readings every 30 s; agronomists
watch dashboards and get threshold alerts. `context/product-description.md`
exists (scope, two user roles, ~2 000 devices year one). Day-zero
architecture is assembled here, per the Init Design workflow, before any
bootstrap.

## Decision

Default module set adopted with no swaps — `backend/python-fastapi`,
`frontend/nextjs`, `workers/celery`, `database/postgres`,
`deployment/docker-compose`. Readings volume does not justify replacing
Postgres on day zero, and the dashboards sit behind a login with no public
pages, so the Next.js baseline stands without the `ssr` addon.

Optional layers walked in order:

| Layer                    | Verdict     | Why                                                                                      |
| ------------------------ | ----------- | ---------------------------------------------------------------------------------------- |
| Identity (`keycloak`)    | **adopted** | two end-user roles (agronomist, admin) at launch, and devices need their own credentials |
| Maintenance (`renovate`) | **adopted** | the compose stack pins image tags from day one, so something has to move them            |

Time-series storage was considered and deferred: 2 000 devices at 30 s is
inside what plain Postgres handles, and adopting a Timescale extension is a
Dependency Change with its own record if the write path outgrows the plan.

## Scope

Design only — this record plus the Technical Stack rows in
`project-summary.md`. The skeleton itself is the follow-up bootstrap record
(003). No behavior contracts exist yet.

## Consequences

Bootstrap scaffolds Keycloak alongside the base services from day one, and
Renovate opens pin-bump PRs from the first green build. Partitioning or a
time-series extension waits for measured pressure; if the readings write
path outgrows the plan, that is a new record, not an edit to this one.

## Contracts Touched

- `project-summary.md` — Technical Stack rows, including the two optional
  layers, pointing at this record.

## Open Questions

## Verification

Skeleton from record 003 is up: health endpoints answer, login round-trip
works against the dev realm, one synthetic reading lands in the readings
table and shows on the dashboard.
