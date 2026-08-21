# Decision: Request tracing across services

Worked reference example following `decisions/_template.md`. Fictional QA automation platform — the same project the other examples describe.

## Status

Implemented

## Type

infra

## Task Weight

Medium

## Context

Job runs flow API → broker → runner → callback; failures could not be traced
across services because each logged its own format with no correlation id.

## Decision

One shared log line format (UTC ISO-8601 ms, level, service, logger, request
id) and an `X-Request-ID` correlation id: the edge accepts or mints it, and
it propagates through HTTP headers, broker message headers, and callback
headers. Each service carries its own small logging module — no shared
package, services stay independent deploy units.

## Scope

API service (middleware + producer headers), runner worker (logger config,
task context, callback header), web client (mints the id). No API shapes or
feature behavior changed.

## Consequences

One `grep "req <id>"` follows a request through every service. Task messages
queued before this change carry no id and log `[req -]` until drained.

## Contracts Touched

- `architecture.md` — Logging Format And Request Tracing (the rules).
- `backend/CLAUDE.md`, runner folder doc — local conventions and the
  additive callback header.

## Open Questions

## Verification

Unit tests for format and header propagation in every service; stack smoke:
one known id greps across all three services' logs, including the callback
hop.
