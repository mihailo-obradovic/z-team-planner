# Feature: Account builds

## Status

Active

## Task Weight

Hard

## Purpose

A signed-in player's builds live on the server and follow them to any device. This is the resource half of accounts (feature 004): every `/builds` endpoint, the import the first-login offer calls, and the storage and validation rules behind them. The public read that share links go through is feature 007; the surface a player touches is feature 008. Anonymous local builds and `?build=` snapshot links (feature 001) are untouched.

## Inputs

| Input               | Type                        | Source                | Constraints                             |
| ------------------- | --------------------------- | --------------------- | --------------------------------------- |
| bearer token        | `Authorization` header      | feature 004           | required on every route here            |
| `name`              | string                      | create, patch, import | trimmed, 1–80; unique per account       |
| `data`              | `SerializedBuild` JSON      | create, patch, import | `v: 1`; the five tiers; ≤ 8 KB          |
| `Idempotency-Key`   | header, opaque string ≤ 128 | create, import        | required; 24 h window per user          |
| `If-Match`          | header, the build's `ETag`  | patch                 | the `updated_at` from the last read     |
| `page`, `page_size` | query ints                  | list                  | defaults 1 and 20; `page_size` ≤ 100    |
| `{id}`              | UUIDv4 path segment         | read, patch, delete   | unguessable; unknown or unowned → `404` |

## Outputs And Side Effects

| Output / Side Effect | Type     | Description                                                                          |
| -------------------- | -------- | ------------------------------------------------------------------------------------ |
| `builds` row         | Postgres | `id, owner_id, name, data jsonb, format_version (generated), created_at, updated_at` |
| build summary        | JSON     | `{ id, name, format_version, created_at, updated_at }` — list items                  |
| build                | JSON     | summary plus `data`; `ETag` header = `updated_at`                                    |
| import report        | JSON     | `[{ index, status: "created" \| "invalid", id?, name?, errors? }]`                   |

## Scope And Non-Goals

In scope:

- List, create, read, update (rename and/or replace data), delete — own builds only.
- Import of local builds, per item, partial success.
- Storage shape, validation tiers, name uniqueness, per-account cap, idempotency, lost-update protection, the error schema every API route uses.

Non-goals:

- Any query into a build's contents (search by hero, by power) — the document is opaque to the database.
- Server-side migration of stored format versions — the client decodes every version it supports.
- Anonymous server-side saves.
- The public read, the share link and its page — feature 007.
- Everything a player sees: the account list, the save paths, the conflict and name dialogs — feature 008.

## User / System Behavior

- The list is the caller's own builds, newest-updated first and paginated; every other route addresses one build by id, and a build the caller does not own is a `404` rather than a `403`.
- Create, import and rename all return the **final** name: on a collision the server suffixes it and answers with what it stored, so the caller never has to guess.
- Editing the same build from two devices: the second `PATCH` carries a stale `ETag` and gets `412` with the current build in the body — enough for the caller to offer a choice rather than silently losing a write.
- A request retried after a network failure carries the same `Idempotency-Key` and gets the original response, not a second build.
- At the cap, create and import answer `409 build_limit` with a message naming the limit.

## Roles And Access

Per feature 004's matrix: a user reaches every route here on their own builds, and another user's build is a `404` on all of them. Anonymous callers reach nothing here — the one route they can reach is feature 007's. Not role-specific beyond that.

## Examples

| Input                                            | Expected Output                                 | Notes               |
| ------------------------------------------------ | ----------------------------------------------- | ------------------- |
| `POST /builds` `{name:"Main", data:{v:1}}` + key | `201`, build with `name:"Main"`                 |                     |
| same request, same key, within 24 h              | `201`, the **same** build                       | idempotent replay   |
| same body, **different** key                     | `201`, `name:"Main (2)"`                        | suffixed            |
| `PATCH` rename to a name another own build has   | `200`, `name:"<name> (2)"`                      | renames suffix too  |
| `PATCH` without `If-Match`                       | `428 precondition_required`                     |                     |
| `PATCH` with a stale `If-Match`                  | `412 precondition_failed`, body = current build | two-device conflict |
| any `data` from `shared/build-cases.json`        | its verdict and exact `details[].path` set      | all tiers + episode |
| `POST /builds` with a 9 KB document              | `413 payload_too_large`                         |                     |
| 21st `POST /builds`                              | `409 build_limit`                               | cap 20              |
| `GET /builds?page=2&page_size=5` with 7 builds   | `200`, 2 summaries, `total: 7`                  |                     |
| `GET /builds/{other user's id}`                  | `404 not_found`                                 | never `403`         |
| import of 3 items, one with an unknown hero id   | `200`, statuses `created, invalid, created`     | partial success     |
| import of 51 items                               | `422`, path `builds`                            | batch cap           |
| `DELETE /me` (feature 004) with 5 builds         | all 5 rows gone; their `/b/` links `404`        | cascade             |

## Business Rules

- **Storage**: one `builds` row per account build; `data` holds the `SerializedBuild` **exactly as validated** and is returned unchanged; `format_version` is generated from `data->>'v'`; the server accepts only versions it knows (`{1}`). No normalization.
- **Validation tiers**, all before any write, `422` with a `path` per failure: (i) structure — only the known keys, `v == 1`; (ii) identity — hero ids among the eleven, `ec`/`eh` among their options; (iii) ranges — `lu` five non-negative ints in `STAT_NAMES` order, `bl` 1–4, `pw` `[0|1, 0|1|2]` within the hero's real trainable count and never without the starting power revealed, `sp` only for Flambae (0/1, needs trainable-2) and Coupé (0–2), `fl` ⊆ Flight School heroes; (iv) budgets — Σ`bl` ≤ 4, trained ≤ 7, distinct `fl` ≤ 2, per hero Σ`lu` ≤ 9 + `bl`; (v) caps — starting + `lu` ≤ 10 per stat.
- **Episode rules**: the cut hero (`ec`) holds no state; recruits — Blonde Blazer and the episode-4 option not hired — may reveal a starting power (`pw` `[1,0]`, which the planner offers on their card) but hold no trained power, `sp` or `fl`; a non-fixed-level recruit may hold `lu`/`bl`; fixed-level heroes never hold `lu`/`bl`.
- **Names**: unique per `(owner_id, name)`, enforced by a database unique index; on collision the server appends ` (n)` with the smallest free `n ≥ 2` and returns the final name. Applies to create, import and rename alike.
- **Cap**: 20 builds per account. **Payload**: 8 KB per document, 50 items per import.
- **Idempotency**: `Idempotency-Key` required on create and import — without it, `422` naming the header. The key plus the user identify a stored response for 24 h; the same key with a different body → `409 idempotency_conflict`. Only a **success** is stored: a rejected document is re-judged on the next attempt, never answered from a day-old cache.
- **Concurrency**: `PATCH` requires `If-Match` equal to the current `updated_at`; the update is a single `UPDATE … WHERE id = ? AND updated_at = ?` so two writers cannot both win.
- **Error schema**, every route: `{ "error": { "code", "message", "details"?: [{ "path", "message" }] } }`; `details` on `422` only; `X-Request-ID` echoed on every response. Codes: `unauthenticated`, `forbidden`, `not_found`, `validation_failed`, `precondition_required`, `precondition_failed`, `build_limit`, `payload_too_large`, `rate_limited`, `idempotency_conflict`.
- Timestamps UTC ISO-8601 with `Z`; the list is ordered by `updated_at` desc.

## Edge Cases

- The suffix loop is bounded by the cap (20), never unbounded. A rename to the build's **own** name is a no-op `200`.
- Import inserts one transaction per item, so a failure in item 3 never touches items 1 and 2. An item's **name** is judged per item too — a local build predating the 80-character rule costs its own row, not the whole offer.
- The `ETag` is Postgres's timestamp, so two writes to one row cannot share it.
- A hand-written `?build=` link can carry a document the guards would refuse into planner state, which feature 001 allows deliberately. Saving it to an account is where it is caught: a `422` whose paths render inline (feature 008).

## Invariants

- `data` round-trips byte-for-byte: what was validated is what is returned.
- The `SerializedBuild` v1 format stays a Protected Area (feature 001); this feature adds validation, never a new key.
- A build id never appears in any list an outsider can read — every route here is owner-scoped.
- Game data has one source, `web/types/hero.ts`; the server validates against a fixture **generated** from it, never a hand copy.

## Error Handling

- Statuses and codes as listed, plus `service_unavailable` for the `503`s below — a client must be able to tell "try again" from a `500`. Unexpected errors are `500` with a request id and no detail.
- Postgres unavailable (Neon suspended and not yet awake) → the pool pre-pings and retries the connection once; a persistent failure is `503` with the request id. Firebase signing certificates unfetchable → `503` too, never `401`: the token may be perfectly good, and signing every user out over a Google outage is what feature 004 calls "no outage-time data loss".

## Entry Points

- API: `app/routes/builds.py` (transport), `app/services/{builds,validation}.py` (the rules), `app/repositories/builds.py`, `app/schemas/builds.py`, `app/models/build.py` + its Alembic revision.
- Fixtures: `shared/game-data.json` (generated by `pnpm run game-data:export`) and `shared/build-cases.json`.

## Dependencies

- Feature 004: the bearer token, the owner, the deletion cascade, the first-login offer that calls import.
- Feature 001: the protected format. Feature 002: `web/types/hero.ts` as the fixture's source.
- Feature 007 reads these rows publicly; feature 008 is the UI that calls these endpoints; feature 006 is the layer both reach them through.
- Decision 004: Neon (pooled endpoint for these routes, direct for migrations), psycopg 3, sync sessions.

## Open Questions

## Tests

- `tests/services/test_validation.py`: every row of `shared/build-cases.json`, failing on exactly the expected paths. `tests/services/test_builds_concurrency.py`: the naming lock, the cap and the `If-Match` guard, by really racing threads.
- `tests/routes/` against testcontainers Postgres: the Examples table row by row, plus the deletion cascade. `tests/repositories/`: the schema's own guarantees.
- `test/unit/game-data.test.ts`: the committed fixture equals a fresh export. `test/nuxt/build-cases.test.ts`: the planner's guards agree with the cases file — a Nuxt test, because those guards are `useState` composables.

## Verification

Ten steps on `feature/005-account-builds`, each verified before its commit; the commit messages carry what each proved. All verbs exit 0: **251 API tests** against real PostgreSQL, **114 web tests**. Some forty mutations were run against the rules; six survived as real gaps, now closed. The endpoints were walked live against the Neon dev branch and the Auth emulator.

Remaining risks: no sign-in through Google itself, and nothing is deployed. Step 9's public read and its limiter are now feature 007, which carries that evidence.

## Agent Change Rules

Before changing this feature, an agent must:

1. Read this feature document.
2. Identify which documented behavior or invariant is affected.
3. Confirm the Status is `Approved` (or later), or ask the user to approve the document first.
4. Add or update tests for the changed behavior.
5. Update this document in the same change if the intended behavior changes.
6. Update `project-summary.md` if the feature summary or status changes.
