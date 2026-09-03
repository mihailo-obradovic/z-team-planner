# Architecture Guide

Applies across projects. Agents follow it unless the user explicitly changes the architecture. Adapt per project via decision records.

## How To Read This File

Three levels. Every rule appears at exactly one level.

| Level                     | Binds                                      | Changed by                             |
| ------------------------- | ------------------------------------------ | -------------------------------------- |
| Architecture Principles   | every project                              | never, in practice                     |
| Universal Rules           | every project, any stack                   | template release, user-approved — rare |
| Stack Modules (`stacks/`) | every project, one module per layer it has | per-project decision record            |

**Agents never change this file on their own initiative.** An agent may propose a change and draft the decision record; the user decides. This holds at every level.

Some Universal Rule sections are scoped by their subject: Client And UI binds projects with a frontend, Asynchronous Work binds projects with async work, Data Protection And Retention binds projects holding personal data. A project without the subject skips the section; no decision record needed.

Versions are minimums ("18+" = 18 or newer stable). New projects start on the newest stable that satisfies them; a major-version move on an existing project is an `upgrade` decision record. Minimums govern choice; builds are reproducible — projects pin exact runtime and dependency versions (lockfiles, image tags).

## Architecture Principles

- Keep business behavior explicit and testable.
- Prefer simple module boundaries over clever abstractions.
- A module owns its data; others access it through its interface, not its storage.
- Keep infrastructure behind interfaces when that eases testing or replacement.
- Do not add dependencies for problems the current stack already solves; when one is justified, prefer boring and stable over niche.
- Do not mix behavior changes with broad refactors unless the task requires it.
- Fail fast and explicitly.
- Operations that can be retried must be safe to retry.
- Configuration is explicit and centralized.

## Dependency Change Rule

Before adding any runtime dependency, framework, package pattern, build plugin, or test tool: check this file. Not allowed by the stack modules in use → get the user's explicit approval, then update `architecture.md` in the same change with the reason. Never add a dependency for one call site's convenience when stdlib or approved tools keep the code clear.

## Documentation Boundaries

This file holds technical structure and dependency choices; everything else routes per the file index (`AGENTS.md`) and Context Loading (`prime-directive.md`). One ownership rule lives here: a project's cross-cutting convention annexes are owned and indexed by this file (`references/convention-annexes.md`) — distinct from `conventions/`, Catalyst's own always-applied set that arrives with the bundle and upgrades with it.

### Convention Annexes

| Annex                      | Covers                                                                                                                                                                                                            | Loads when                                                                                                          |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `annexes/design-system.md` | Colour ramps and the semantic aliases behind them, the type scale, spacing, control heights, radius, elevation, z-index, motion, iconography, imagery, and the per-element values components are checked against. | Styling anything, adding or changing a token, picking a size, shadow or spacing value, or building a new component. |

Instantiated from `stacks/frontend/nuxt/design-system.md` by decision 003; the template stays pristine and the annex is the contract. Its load trigger is listed in `prime-directive.md` (Context Loading).

## Universal Rules

Stack-neutral. Every project, every stack module.

### Layering

- Business rules live in domain/service code — never in UI, routes, transport, or storage-mapping layers.
- Dependencies point one way: transport → service → persistence. A lower layer never imports an upper one.
- A message consumer is a transport boundary: deserialize, validate, call a service, acknowledge. No business logic. Every rule written for routes applies to consumers unchanged.
- One application core per domain: new deployables come from optional stack layers and job isolation (workers, consumers, DAG tasks) — splitting the domain into separate services is a decision record with a stated trigger (independent release cadence, isolation requirement, team scaling), never an aesthetic.

### Conventions

- All timestamps UTC, ISO-8601, with explicit offset or `Z`.
- Event time and ingestion time are separate fields wherever both exist; never overwrite one with the other.
- Identifiers crossing a service boundary are opaque strings to the receiver.
- Money and physical quantities carry an explicit unit in name or type — never a bare `float value`; money is exact decimal or integer minor units, never binary floating point.

### Validation

- Structural validation at the transport boundary with declared schemas/DTOs — never inlined in endpoints or consumers.
- Business validation in services or domain code, not in schemas.
- Validation errors are clear and never leak internal detail.
- All external input is untrusted, including input from other internal services.

### Contracts

- The contract is written before the implementation and is the reviewed artifact. Minimum content — HTTP: paths, request/response schemas, error shapes, auth requirements. Messages: schema, topic/queue name, version. Tables: owning module, migration.
- Every list endpoint paginates; one pagination convention per project.
- A breaking change to a contract whose consumers do not deploy atomically with the producer ships behind a new version, and the old version gets a stated removal date. Where the producer and all consumers ship together (one app, one deploy), the contract may change in one change — the Same-Change Rule covers the documents.
- Additive changes (new optional field, ignorable enum member) are not breaking.
- Consumers ignore unknown fields.
- When the other side of a contract is another team, the contract lives where that team reads it and names an owner — a shape agreed in chat is not a contract.

### Error Handling

- Expected errors map to correct status codes/error types through central error handling — one place, consistent shapes.
- Never swallow exceptions; never mask a failure with a fallback or null-ish value. Absence is a domain outcome, not a failure — a repository may return "not found"; unexpected errors always raise.
- Retryable and permanent failures are distinguishable without parsing a message string.

### Idempotency

- Any operation reachable more than once (retried request, redelivered message, re-run job) produces the same end state as one execution.
- Achieved with a natural key or explicit idempotency key — never by assuming exactly-once delivery.
- The deduplication window is documented in the owning feature document.

### Configuration And Secrets

- All environment access through one central configuration entry point; no scattered env reads.
- No hardcoded URLs, secrets, or API keys — in code, tests, or compose files.
- Configuration is validated at startup; a missing/malformed value stops the process.
- Secrets live in the consuming process's environment — never in task payloads, message payloads, or the database.

### Persistence

- A schema change ships with its migration in the same change.
- Migrations are forward-only in production; a rollback is a new migration.
- Transaction boundaries live in the service layer.
- Business invariants that must hold under concurrency are enforced by the database — unique/check/FK constraints or explicit locking. A service-level check alone is a race, not enforcement (mirrors: hiding UI is not authorization).
- Explicit queries for complex reads.
- Every production datastore has automated backups with a stated schedule and retention — and a restore procedure that has actually been tested; an untested backup does not count as a backup.
- Restore rehearsal is repeated after material schema or infrastructure changes; point-in-time recovery is part of the procedure where the engine supports it.

### Asynchronous Work

- The producing side only enqueues/emits; work definitions and execution live in the consuming service.
- Job families are isolated: one family's backlog or failure never blocks another; each scales and fails independently.
- Concurrency and timeouts are explicit and matched to the workload (resource-heavy jobs: concurrency 1).
- Every consumer is idempotent — delivery is at-least-once.
- A message that exhausts its retry budget goes to a dead letter destination with the failure reason; never dropped, never retried forever.
- Large payloads never travel inline — not in a broker message, task argument, or table column. The payload goes to object storage and the message carries the reference (claim check); the size threshold is stated in the owning feature document.

### Logging

- Standard logging facility, never print-style output.
- Log useful context, not noisy traces.
- Never log secrets, tokens, API keys, or full request bodies.

### Logging Format And Request Tracing

One shared line format across all services (APIs, workers, consumers, DAG tasks):

```text
[2026-07-03T08:31:35.123Z] [INFO] [api] [orders.service] [req 59e3cc] message
```

- UTC, ISO-8601, milliseconds.
- Fields in order: level, service name, logger name, request id, message. Thread/task/partition/DAG-run id may append as an optional extra field.
- The edge service accepts `X-Request-ID` or generates one; it propagates through every hop (HTTP headers, broker task/message headers, callback headers) so one request greps across all services.
- Records without request context log `[req -]`.

### Observability

- Every service answers a liveness check (process up) and a readiness check — distinct checks; the mechanism is a stack binding (HTTP endpoint, healthcheck command).
- Readiness fails only when the service cannot perform its core function; a temporarily degraded optional dependency does not fail readiness.
- Every service exposes metrics in one project-wide format: at minimum request/message rate, error rate, latency distribution.
- Metric labels have bounded cardinality; request ids, user ids, emails, and other unbounded values are never labels.
- Async consumers additionally expose backlog depth (queue length or consumer lag) and dead-letter count; backlog is the primary scaling and alerting signal.
- Metrics/health endpoints are never on the user-traffic auth seam and never publicly routable.
- Dashboards and alert rules are versioned files in the repository, provisioned on startup — never hand-built in a monitoring UI. Identifiers the provisioned files depend on (datasource UIDs) are pinned. At minimum, a service-down alert exists.

### Security

- Authentication and authorization centralized in one seam; never frontend-only checks.
- Bearer tokens are validated for signature, time bounds, issuer, **and audience** — a token minted for another client never passes.
- Hiding UI by role is UX, never authorization: the server is the only gate; every permission in the access matrix is enforced server-side.
- Keep per-user secrets out of the database when the design allows.
- Service-to-service calls authenticate; the network perimeter is not the authorization boundary.
- Containers run as non-root with minimal privileges.
- Request and upload size limits are explicit at the edge.
- CORS is deny-by-default; the allowlist comes from configuration.
- Publicly exposed endpoints are rate limited at the edge; internal ones are not, by default. Naming the edge component is part of going public — a decision record.
- Outbound requests to user-supplied URLs are validated against an allowlist (SSRF).

### Data Protection And Retention

- Personal data is identified in the feature document that introduces it, with lawful basis and retention period.
- Every table, topic, and bucket holding personal data has an explicit retention/deletion policy; "keep forever" is a recorded decision.
- Subject-data deletion works across every tier that stores it (archives, caches, message logs). A tier that cannot honor deletion must not receive personal data.
- Non-production environments never receive production personal data unless anonymized or synthetic.
- Data classification (public/internal/personal/sensitive) is stated where the data is defined.

### Testing

- Unit-test services and repositories: fast, focused.
- Integration tests when behavior depends on framework wiring, transactions, serialization, or persistence.
- Integration tests run against the same engines as production (real database, real broker), never a lookalike substitute.
- Frontend tests exercise user-visible behavior, not implementation details; a project may trade automated frontend tests for the live browser walk (prime directive) — recorded per feature in its Tests section.
- A bug fix ships with a regression test that fails before it and passes after; where that is impractical, the fix states why (prime directive, Bug Fixes).

### Client And UI

- All frontend requests through a single API client wrapper (headers, base URL in one place); no inline HTTP in components.
- Server state and client state are distinct; server-owned data is never mirrored into local component state for parallel editing. An explicit form draft is client state until submit — a deliberate exception, not an accidental copy.
- Every async view has explicit loading and error states.
- Organize UI by functionality, not account type: one section per capability, role decides visibility and enabled options — never parallel per-role screens.
- Frontend configuration is injected at build time, never hardcoded.

## Stack Modules

The stack is a **selection** — one module per layer from the index below. A module names the concrete tools and binds the Universal Rules to them; it never restates a Universal Rule, and its tools are defaults, swappable per project by decision record. `project-summary.md` (Technical Stack) records what the project actually runs; each adopted module's document is normative.

A module is a single `<module>.md` or a `<module>/` directory: nested choice dirs (e.g. the frontend `ui/` libraries) are follow-up questions answered at spawn, an `addons/` dir holds optional add-on docs for that module (an addon may carry a sibling payload dir of the same name — extra docs and rules that travel with it), and a `rules/` dir is a per-rule payload loaded through the doc that routes it — a `performance.md` router, or the addon doc that owns the payload — never wholesale. `starter/` and `setup.py` are reserved inside a module for the app scaffold and its setup hook; neither is supported yet, and a module carrying one is copied for its documents alone, with a note.

**Module documents.** A module or tier holding more than its own contract document indexes the rest under a `## Module Documents` heading, three columns — Document, What it holds, Load. The Load cell is the trigger that loads that document — an imperative condition ("When defining or organizing types"), or "Always, with the module" for the contract document's own row, which holds "This document — the module contract and approved libraries" — never a second description. Header position is for machine-read fields only (`**Layer:**`/`**Tool:**` or `**Tier:**`, and `**Requires:**`, which any module or addon may declare); anything else a module depends on belongs in its body.

**Shared tiers.** Guidance that serves more than one module lives in underscore-prefixed tier directories under `stacks/`. This bundle carries `_lang/typescript/` and `_lang/python/` (language-level), `frontend/_vue/` (Vue-general) and `frontend/_common/` (framework-agnostic frontend rules, e.g. component file naming). A tier is never a spawn question; a module or addon declares the tiers it needs with a `**Requires:**` header (`python-fastapi` requires `_lang/python`; `nuxt` requires `_lang/typescript · frontend/_vue · frontend/_common`), and the scaffolder copies them whenever that module is chosen. Tier docs carry a `**Tier:**` header instead of Layer/Tool.

This table lists what **this project** runs — pruned from the template's full catalogue to the modules the bundle carries, since a bundle must never reference documents its repository does not contain. Layers the project has declined are named without a link; adopting one later copies its document in from the Catalyst template by decision record.

| Layer                      | Module                                                                                                                                                                                                                                         |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Backend                    | [python-fastapi](stacks/backend/python-fastapi.md) — adopted by decision 004                                                                                                                                                                   |
| Frontend                   | [nuxt](stacks/frontend/nuxt/nuxt.md) (Vue) — UI: [nuxtui](stacks/frontend/nuxt/ui/nuxtui/nuxtui.md); addons: [ssr](stacks/frontend/nuxt/addons/ssr.md); design system instantiated from [design-system](stacks/frontend/nuxt/design-system.md) |
| Persistence                | [postgres](stacks/database/postgres.md), hosted on Neon — adopted by decision 004                                                                                                                                                              |
| Identity (optional)        | Firebase Authentication — the template's `keycloak` module **swapped** by decision 004, which is the contract; no module document in this bundle                                                                                               |
| Background work (optional) | declined (`celery` in the template) — no work outside the request/response cycle                                                                                                                                                               |
| Deployment (optional)      | declined (`docker-compose` in the template) — a managed database and a hosted IdP leave no multi-service run to orchestrate (decision 004)                                                                                                     |
| Maintenance (optional)     | deferred (`renovate` in the template) — decision 001                                                                                                                                                                                           |

### Approved Dependencies Beyond The Modules

Packages this project runs that the adopted stack modules' Approved Libraries do not already name. One row per package, added with the user's explicit approval in the same change that introduces it (Dependency Change Rule).

| Package             | Group   | Layer   | Why it is needed                                                                                                                                                                                                                                                                         | Approved by  |
| ------------------- | ------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| `uvicorn[standard]` | runtime | Backend | FastAPI is an ASGI framework and ships no server; nothing runs without one.                                                                                                                                                                                                              | decision 005 |
| `pydantic-settings` | runtime | Backend | Pydantic v2 moved `BaseSettings` into its own distribution; the module's one-`Settings`-class binding needs it.                                                                                                                                                                          | decision 005 |
| `httpx`             | dev     | Backend | Starlette's `TestClient` is a thin wrapper over it; no route can be tested without it.                                                                                                                                                                                                   | decision 005 |
| `firebase-admin`    | runtime | Backend | Google's own SDK is the only sanctioned way to check a Firebase ID token's signature, time bounds, issuer and audience, and it caches the signing certificates correctly; feature 004 also needs it to delete a Firebase user.                                                           | feature 005  |
| `google-auth`       | runtime | Backend | Running `firebase-admin` against the Auth emulator needs a credential that authenticates nothing, and `AnonymousCredentials` is that credential. Already a hard dependency of `firebase-admin`; declared because the code imports it directly, and a transitive import is not a promise. | feature 004  |

`psycopg` is not listed here — the persistence module's Backend Pairings table already names it as the `python-fastapi` client.

| Package              | Group   | Layer    | Why it is needed                                                                                                                                                                      | Approved by      |
| -------------------- | ------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- |
| `pinia`              | runtime | Frontend | The store library the Nuxt module's client-state rules are written against.                                                                                                           | feature 006      |
| `@pinia/nuxt`        | runtime | Frontend | Nuxt integration for the above.                                                                                                                                                       | feature 006      |
| `@pinia/colada`      | runtime | Frontend | Server-state cache; the only home for API responses.                                                                                                                                  | feature 006      |
| `@pinia/colada-nuxt` | runtime | Frontend | Nuxt integration for the above.                                                                                                                                                       | feature 006      |
| `zod`                | runtime | Frontend | Responses are parsed at the service boundary, never asserted.                                                                                                                         | feature 006      |
| `firebase`           | runtime | Frontend | The web SDK that issues the ID token every request carries.                                                                                                                           | feature 006      |
| `@regle/core`        | runtime | Frontend | Form validation whose rules mirror the server's.                                                                                                                                      | feature 006      |
| `@regle/rules`       | runtime | Frontend | The rule set for the above.                                                                                                                                                           | feature 006      |
| `@regle/nuxt`        | runtime | Frontend | Nuxt integration for the above.                                                                                                                                                       | feature 006      |
| `temporal-polyfill`  | runtime | Frontend | `Date` is banned outright (`catalyst/conventions/code-style.md`), and `Temporal` is not Baseline yet; the ponyfill is what the one timestamp-formatting boundary runs on until it is. | user, 2026-08-30 |

`@vueuse/core` was considered and deliberately not added (feature 006).

### Approved CI Actions

The GitHub Actions the pipeline uses. Actions are not packages and carry no lockfile row, so they are recorded here under the same rule; each is pinned to a major tag, which Renovate moves once the Maintenance layer is adopted.

| Action               | Job  | Why it is needed                                                                                                                                     | Approved by      |
| -------------------- | ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- |
| `actions/checkout`   | both | The source has to be on the runner.                                                                                                                  | decision 005     |
| `jdx/mise-action`    | web  | `mise.toml` is the only Node pin and `actions/setup-node` cannot read it, so the toolchain is installed from the pin file itself rather than a copy. | user, 2026-09-03 |
| `pnpm/action-setup`  | web  | Installs the exact pnpm named in `packageManager`.                                                                                                   | decision 005     |
| `actions/cache`      | web  | Caches the pnpm store keyed to the lockfile — the caching that left with `actions/setup-node`.                                                       | user, 2026-09-03 |
| `astral-sh/setup-uv` | api  | Installs uv, which then provisions the interpreter from `.python-version`.                                                                           | decision 005     |

`temporal-polyfill` is imported inside `web/utils/formatTimestamp.ts` rather than installed as a global shim. That does **not** keep it out of the first load: Rollup merges it into the shared vendor chunk alongside `firebase`, `zod` and `regle`, and that chunk is preloaded from the prerendered `/`. Measured cost of the class API as used here is **22 kB gzip**; the tree-shaken `fns/Instant` entrypoint would be 4.6 kB. The class API was kept deliberately — it is the shape `Temporal` will have natively, so reaching Baseline means deleting one import and this dependency with no change to calling code, where the `fns` form would have to be rewritten. The extra weight is accepted as temporary.

The composition floor is **at least one of Backend and Frontend, and a backend brings Persistence with it**. Every other layer is **optional**, adopted when its trigger fires, not in anticipation, and never replacing that floor. Background work: when work must run outside the request/response cycle — queues, scheduled jobs, fan-out. Deployment: when the project needs a reproducible multi-service run or ship story rather than each service started by hand. Identity: when the product gains end-user accounts, roles, or permissions beyond a single trusted operator group — a small internal tool never pays the IdP tax, and nobody hand-rolls auth to dodge it. Maintenance: once the project has a committed lockfile or pinned image tags to keep current; pins stay exact, and bumping an existing dependency is not a way around the Dependency Change Rule, which still owns every _new_ one.
