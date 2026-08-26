# Feature: Account builds and share links

## Status

Approved

## Task Weight

Hard

## Purpose

A signed-in player's builds live on the server, follow them to any device, and share by a **live** link that always shows the owner's latest edits. This is the resource half of accounts (feature 004): every `/builds` endpoint, the public read, the import that the first-login offer calls, and the storage and validation rules behind them. Anonymous local builds and `?build=` snapshot links (feature 001) are untouched.

## Inputs

| Input               | Type                        | Source                      | Constraints                                                                |
| ------------------- | --------------------------- | --------------------------- | -------------------------------------------------------------------------- |
| bearer token        | `Authorization` header      | feature 004                 | required on every route except the public read                             |
| `name`              | string                      | create, patch, import       | trimmed, 1–80 chars; unique per account — the server suffixes on collision |
| `data`              | `SerializedBuild` JSON      | create, patch, import       | `v: 1`; the five validation tiers below; ≤ 8 KB                            |
| `Idempotency-Key`   | header, opaque string ≤ 128 | create, import              | required; 24 h window per user                                             |
| `If-Match`          | header, the build's `ETag`  | patch                       | required; the `updated_at` value from the last read                        |
| `page`, `page_size` | query ints                  | list                        | defaults 1 and 20; `page_size` ≤ 100                                       |
| `{id}`              | UUIDv4 path segment         | read, patch, delete, public | unguessable by construction; unknown or unowned → `404`                    |

## Outputs And Side Effects

| Output / Side Effect | Type     | Description                                                                          |
| -------------------- | -------- | ------------------------------------------------------------------------------------ |
| `builds` row         | Postgres | `id, owner_id, name, data jsonb, format_version (generated), created_at, updated_at` |
| build summary        | JSON     | `{ id, name, format_version, created_at, updated_at }` — list items                  |
| build                | JSON     | summary plus `data`; `ETag` header = `updated_at`                                    |
| public build         | JSON     | `{ id, name, data, updated_at }` — never the owner                                   |
| import report        | JSON     | `[{ index, status: "created" \| "invalid", id?, name?, errors? }]`                   |
| `/b/{id}` page       | rendered | read-only planner in shared mode with **Save a copy**; `404` page when gone          |

## Scope And Non-Goals

In scope:

- List, create, read, update (rename and/or replace data), delete — own builds only.
- The public read and its `/b/{id}` page; "save a copy" as a plain create.
- Import of local builds, per item, partial success.
- Storage shape, validation tiers, name uniqueness, per-account cap, idempotency, lost-update protection, the error schema every API route uses.

Non-goals:

- Any query into a build's contents (search by hero, by power) — the document is opaque to the database.
- Server-side migration of stored format versions — the client decodes every version it supports.
- Anonymous server-side saves; a snapshot-style link for account builds (the `?build=` link already is one).
- Rate limiting at a real edge — the hosting effort names it; see Business Rules for the stopgap.

## User / System Behavior

- **My builds** lists the account's builds newest-updated first; opening one loads its document into the planner and makes it the active account build. Saving writes back with `PATCH` and the held `ETag`.
- Save-as-new and the first-login offer create builds; a colliding name comes back suffixed (`Name (2)`), and the UI shows the returned name.
- **Share** on an account build copies `https://<web>/b/{id}`; every open shows the owner's current document, read-only, with **Save a copy** (signed in: `POST /builds`; signed out: local "Save as mine"). Deleting the build makes the link a `404` page.
- Editing the same build from two devices: the second `PATCH` with a stale `ETag` gets `412` plus the current build, and the UI offers "reload theirs" or "save mine as new".
- A request retried after a network failure carries the same `Idempotency-Key` and gets the original response, not a second build.
- At 20 builds, create and import answer `409 build_limit`; the UI says so before offering the dialog.

## Roles And Access

Per feature 004's matrix: anonymous — public read only; user — every route on their own builds; another user's build — `404` on every route. Not role-specific beyond that.

## Examples

| Input                                                | Expected Output                                    | Notes                        |
| ---------------------------------------------------- | -------------------------------------------------- | ---------------------------- |
| `POST /builds` `{name:"Main", data:{v:1}}` + key     | `201`, build with `name:"Main"`                    |                              |
| same request, same key, within 24 h                  | `201`, the **same** build                          | idempotent replay            |
| same body, **different** key                         | `201`, `name:"Main (2)"`                           | unique per account, suffixed |
| `PATCH` rename to a name another own build has       | `200`, `name:"<name> (2)"`                         | suffix on rename too         |
| `PATCH` without `If-Match`                           | `428 precondition_required`                        |                              |
| `PATCH` with a stale `If-Match`                      | `412 precondition_failed`, body = current build    | two-device conflict          |
| any `data` from `shared/build-cases.json`            | that file's verdict and exact `details[].path` set | every tier and episode rule  |
| `POST /builds` with a 9 KB document                  | `413 payload_too_large`                            |                              |
| 21st `POST /builds`                                  | `409 build_limit`                                  | cap 20                       |
| `GET /builds?page=2&page_size=5` with 7 builds       | `200`, 2 summaries, `total: 7`                     |                              |
| `GET /builds/{other user's id}`                      | `404 not_found`                                    | never `403`                  |
| `GET /shared/{id}` signed out                        | `200`, no owner field                              |                              |
| `GET /shared/{id}` after the owner deleted it        | `404`                                              |                              |
| `GET /shared/{id}` 61st time in a minute from one IP | `429 rate_limited`                                 | stopgap limiter              |
| import of 3 items, one with an unknown hero id       | `200`, statuses `created, invalid, created`        | partial success              |
| import of 51 items                                   | `422`, path `$`                                    | batch cap                    |
| `DELETE /me` (feature 004) with 5 builds             | all 5 rows gone; their `/b/` links `404`           | cascade                      |

## Business Rules

- **Storage**: one `builds` row per account build; `data` holds the `SerializedBuild` **exactly as validated** and is returned unchanged; `format_version` is generated from `data->>'v'`; the server accepts only versions it knows (`{1}`). No normalization.
- **Validation tiers**, all before any write, `422` with a `path` per failure: (i) structure — only the known keys, `v == 1`; (ii) identity — hero ids among the eleven, `ec`/`eh` among their options; (iii) ranges — `lu` five non-negative ints in `STAT_NAMES` order, `bl` 1–4, `pw` `[0|1, 0|1|2]` within the hero's real trainable count and never without the starting power revealed, `sp` only for Flambae (0/1, needs trainable-2) and Coupé (0–2), `fl` ⊆ Flight School heroes; (iv) budgets — Σ`bl` ≤ 4, trained ≤ 7, distinct `fl` ≤ 2, per hero Σ`lu` ≤ 9 + `bl`; (v) caps — starting + `lu` ≤ 10 per stat.
- **Episode rules**: the cut hero (`ec`) holds no state; recruits — Blonde Blazer and the episode-4 option not hired — may reveal a starting power (`pw` `[1,0]`, which the planner offers on their card) but hold no trained power, `sp` or `fl`; a non-fixed-level recruit may hold `lu`/`bl`; fixed-level heroes never hold `lu`/`bl`.
- **Names**: unique per `(owner_id, name)`, enforced by a database unique index; on collision the server appends ` (n)` with the smallest free `n ≥ 2` and returns the final name. Applies to create, import and rename alike.
- **Cap**: 20 builds per account. **Payload**: 8 KB per document, 50 items per import.
- **Idempotency**: `Idempotency-Key` required on create and import; the key plus the user identify a stored response for 24 h; the same key with a different body → `409 idempotency_conflict`.
- **Concurrency**: `PATCH` requires `If-Match` equal to the current `updated_at`; the update is a single `UPDATE … WHERE id = ? AND updated_at = ?` so two writers cannot both win.
- **Public read** exposes id, name, document and `updated_at` only. Stopgap rate limit until the hosting effort names the edge: an in-process token bucket on `/shared/*`, 60 requests per minute per IP, stdlib only — recorded as a stopgap, to be removed when the edge exists.
- **Error schema**, every route: `{ "error": { "code", "message", "details"?: [{ "path", "message" }] } }`; `details` on `422` only; `X-Request-ID` echoed on every response. Codes: `unauthenticated`, `forbidden`, `not_found`, `validation_failed`, `precondition_required`, `precondition_failed`, `build_limit`, `payload_too_large`, `rate_limited`, `idempotency_conflict`.
- Timestamps UTC ISO-8601 with `Z`; the list is ordered by `updated_at` desc.

## Edge Cases

- The suffix loop is bounded by the cap (20), never unbounded. A rename to the build's **own** name is a no-op `200`.
- Import inserts one transaction per item, so a failure in item 3 never touches items 1 and 2.
- The `ETag` is Postgres's timestamp, so two writes to one row cannot share it.
- A `?build=` receiver who signs in gets no import offer for the snapshot — they use **Save a copy** like any viewer.
- A hand-written `?build=` link can carry a document the guards would refuse into planner state, which feature 001 allows deliberately. Saving it to an account is where it is caught: a `422` whose paths render inline (feature 006).

## Invariants

- `data` round-trips byte-for-byte: what was validated is what is returned.
- The `SerializedBuild` v1 format stays a Protected Area (feature 001); this feature adds validation, never a new key.
- Unlisted-by-id is the only access control on the public read; ids are never enumerable and never appear in any list an outsider can see.
- Game data has one source, `web/types/hero.ts`; the server validates against a fixture **generated** from it, never a hand copy.

## Error Handling

- Statuses and codes as listed, plus `service_unavailable` for the `503`s below — a client must be able to tell "try again" from a `500`. Unexpected errors are `500` with a request id and no detail.
- Postgres unavailable (Neon suspended and not yet awake) → the pool pre-pings and retries the connection once; a persistent failure is `503` with the request id. Firebase signing certificates unfetchable → `503` too, never `401`: the token may be perfectly good, and signing every user out over a Google outage is what feature 004 calls "no outage-time data loss".

## Entry Points

- `app/routes/builds.py`, `app/routes/shared.py` — transport only.
- `app/services/builds.py` — naming, cap, idempotency, concurrency; `app/services/validation.py` — the five tiers and episode rules.
- `app/models/build.py`, `alembic/versions/*_builds.py` — the row and its unique index.
- `shared/game-data.json` (generated by `pnpm run game-data:export`), `shared/build-cases.json` — the two fixtures.
- `web/pages/b/[id].vue`, `web/services/builds.api.ts`, `web/services/queries/useBuildQueries.ts`.

## Dependencies

- Feature 004: the bearer token, the owner, the deletion cascade, the first-login offer that calls import.
- Feature 001: the protected format. Feature 002: `web/types/hero.ts` as the fixture's source; the starting stats become an exported constant there (today inside the Nitro handler).
- Frontend data layer (next document): the fetcher, query composables and the `/b/{id}` page's data path.
- Decision 004: Neon (pooled endpoint for these routes, direct for migrations), psycopg 3, sync sessions.

## Open Questions

## Tests

- `tests/services/test_validation.py`: every row of `shared/build-cases.json` — the valid ones pass, the invalid ones fail on exactly the expected paths.
- `tests/routes/test_builds.py` (testcontainers Postgres): the Examples table row by row — idempotent replay, suffixing on create/import/rename, `428`/`412`, cap, cascade, `404` for unowned.
- `tests/routes/test_shared.py`: public shape without owner, `404` after delete, the stopgap `429`.
- `test/unit/game-data.test.ts`: the committed fixture equals a fresh export; `test/nuxt/build-cases.test.ts`: the planner's guards agree with the cases file — a Nuxt-environment test, because those guards are `useState` composables.

## Verification

## Agent Change Rules

Before changing this feature, an agent must:

1. Read this feature document.
2. Identify which documented behavior or invariant is affected.
3. Confirm the Status is `Approved` (or later), or ask the user to approve the document first.
4. Add or update tests for the changed behavior.
5. Update this document in the same change if the intended behavior changes.
6. Update `project-summary.md` if the feature summary or status changes.
