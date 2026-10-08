# Feature: Share links

## Status

Active

## Task Weight

Medium

## Purpose

An account build shares by a **live** link: `/b/{id}` always shows the owner's current document, read-only, to anyone holding the link and nobody who does not. This is feature 005's public half — the one token-less route, its unguessable-id access model, its stopgap ceiling, and the page it renders. The `?build=` snapshot (feature 001) is a different thing.

## Inputs

| Input        | Type                | Source         | Constraints                                             |
| ------------ | ------------------- | -------------- | ------------------------------------------------------- |
| `{id}`       | UUIDv4 path segment | the share link | unguessable; unknown, deleted or malformed → `404`      |
| bearer token | —                   | —              | **never** read: the only route with no `CurrentUserDep` |
| caller IP    | socket peer         | the request    | the limiter's key; behind a proxy, the proxy            |

## Outputs And Side Effects

| Output / Side Effect | Type         | Description                                                            |
| -------------------- | ------------ | ---------------------------------------------------------------------- |
| public build         | JSON         | `{ id, name, data, updated_at }` — never the owner, never `created_at` |
| `/b/{id}` page       | rendered     | read-only planner with **Save a copy**; the 404 page when gone         |
| clipboard link       | UI           | `https://<web>/b/{id}`, from **Share** on an account build             |
| query cache entry    | Pinia Colada | key `['shared','get',id]`; gated on nothing, invalidates nothing       |

## Scope And Non-Goals

In scope:

- `GET /api/v1/shared/{id}` — the public read, its shape and its `404`.
- The stopgap rate limit on `/shared/*`.
- **Share** copying the live link for an account build.
- `/b/[id].vue`: pending skeleton, read-only planner, **Save a copy**, the error page for a dead link or a failed read, `noindex`.
- The service and query composable behind that page.

Non-goals:

- Rate limiting at a real edge — none exists (decision 007); the ceiling here is a stopgap.
- Server-side rendering of `/b/{id}`; its link preview is feature 027's static Open Graph image.
- Any write path from the page: **Save a copy** creates a new build, it never touches the owner's.
- A snapshot-style link for account builds — `?build=` already is one (feature 001).
- Revocation, expiry, per-recipient links, or any view count.

## User / System Behavior

- **Share** on an open account build copies `https://<web>/b/{id}`. Anything else — a local build, or nothing open — has no server id, so it copies the `?build=` snapshot.
- **Share** on an account build with unsaved changes saves it first, then copies, since the link resolves to the stored document. A failed save copies nothing and reports through the central policy (a `412` opens feature 008's conflict dialog); the toast names the save.
- Every load of the link — opening or reloading it — shows the owner's **current** document, with no new link. An open page never reads again: returning to the tab or from `/privacy` shows what was loaded.
- A skeleton shows while pending, then the **read-only form**: hero cards with their `readonly` prop, never an `inert` wrapper (which hides the build from a screen reader).
- **Save a copy** creates an account build signed in (`POST /builds`), a local one signed out, under the shared name (suffixed if taken, 029), and lands on `/` with the copy open — so it cannot be made twice. Loading, it takes no further clicks; failing, it stays on the page, ready again, and toasts through the central policy (a `409` names the limit).
- The header here shows only the title, the read-only budget counters and the sign-in menu — no Save, build menu, **Share** or **Story setup**, which would act on a build that is not open.
- Leaving without a copy returns the planner exactly as it was (feature 029); a copy over unsaved changes asks 029's discard confirmation.
- The owner opening their own link sees the same read-only page; editing happens on `/`.
- Once the owner deletes the build the link is the 404 page, which never says the build existed.
- A read that fails for any other reason — the limit, a server fault, no answer at all — is the error page too, in its generic wording (feature 009). The page never renders an empty region.
- A read that fails behind a build already on screen changes nothing: what is rendered stays, silently.
- Never indexed (`robots: noindex, nofollow`): an unlisted id is the only thing keeping it private.

## Roles And Access

Anonymous and signed-in callers get the identical read, ownership invisible either way — per feature 004's matrix, the single row an anonymous caller carries. Not otherwise role-specific: only which **Save a copy** path runs varies by sign-in.

## Examples

| Input                                         | Expected Output                                    | Notes                           |
| --------------------------------------------- | -------------------------------------------------- | ------------------------------- |
| `GET /shared/{id}` signed out                 | `200`, no owner field                              | the only token-less route       |
| `GET /shared/{id}` after the owner deleted it | `404 not_found`                                    | same answer as never-existed    |
| `GET /shared/not-a-uuid`                      | `404 not_found`, the same body                     | never a `422` naming the id     |
| `GET /shared/{id}` 61st in a minute, one IP   | `429 rate_limited`                                 | stopgap limiter                 |
| open `/b/<valid id>`                          | skeleton, then read-only planner + **Save a copy** | cards readable, no controls     |
| open `/b/<deleted id>`                        | the 404 page                                       | `createError`, not a toast      |
| open `/b/<malformed id>`                      | the 404 page                                       | a dead share link like any      |
| the read answers `503`, or no answer          | the error page: `503`, "Something went wrong"      | no toast                        |
| a build on screen, a later read answers `503` | the build stays; no page, no toast                 | nothing to lose by keeping it   |
| owner deletes or edits it, refocus            | the build stays, silently; reload shows the change | no background read              |
| **Save a copy** signed in                     | `POST /builds`; `/` with the copy open             | may come back suffixed (005)    |
| **Save a copy** signed out                    | a local build; `/` with the copy open              | suffixed if taken (029)         |
| **Save a copy** answers `409`                 | stays on the page; the limit toast                 | button ready again              |
| **Save a copy** clicked twice quickly         | one `POST`                                         | loading state                   |
| open the page                                 | header: title, counters, sign-in only              | no build controls               |
| edits on `/`, open a link, go Back            | `/` with the edits still unsaved                   | planner set aside, restored     |
| **Share** on an account build                 | clipboard holds `/b/{id}`                          | live                            |
| **Share** on an account build, unsaved edits  | `PATCH` first, then `/b/{id}` copied               | link matches what is on screen  |
| that save answers `412`                       | conflict dialog; clipboard untouched               | a stale link is worse than none |
| **Share** with no account build open          | clipboard holds `?build=`                          | snapshot (001, 029)             |
| the owner opens their own link                | read-only planner                                  | no edit path on this page       |

## Business Rules

- **Exposure**: id, name, document and `updated_at` only — never `owner_id`, never `created_at`.
- **Access control** is the unguessable id and nothing else. No ownership check exists to fail, so there is no `403`: unknown, deleted and someone else's are one answer. A malformed id joins them — the route takes the segment as text, so a mistyped link is a `404` too and never a `422`.
- **Stopgap rate limit**: an in-process token bucket on `/shared/*`, 60 per minute per caller, stdlib only. It counts **per worker** — inert on serverless instances (decision 007) — and keys on the socket peer, which behind a proxy is the proxy. Recorded in `operations.md`.
- **Client-rendered** (`ssr: false` for `/b/**`): rendering it on the server would risk serving one viewer's build to the next.
- Query key `['shared','get',id]`, no `enabled` gate on auth — the read works signed out, which is the point — and nothing here invalidates anything.
- **Never re-read while open** (`staleTime: Infinity`): focus, reconnect and a remount keep what was loaded, or a background `404` would put the 404 page over a rendered build.

## Edge Cases

- A `?build=` receiver who signs in gets no import offer for that snapshot — it is not one of their local builds. They use **Save a copy** like any viewer.
- A viewer already on the page keeps what is rendered when the owner deletes or edits the build; the next load shows the change.

## Invariants

- The response never carries the owner, and a build id never appears in any list an outsider can read.
- The page has no write path to the owner's build: the only mutation it can start creates a **new** one.
- The read-only form hides nothing from assistive technology that a sighted viewer sees, and renders no control.
- Nothing on `/b/{id}` invalidates the query cache.
- The page stays `noindex, nofollow` for as long as an unlisted id is the access control.

## Error Handling

- `404` → the error page, not a toast: a dead share link is a page-level outcome, and the central policy (feature 006) routes `/b/…` that way specifically.
- Every other failure of the read — `429`, `500`, `503`, no answer, a Zod failure (still logged) — → the error page in its generic wording, raised by `useSharedBuild` only while no build is on screen; the read silences its own toasts.
- Two raisers, deliberately: the central policy keys on the route path, and **Save a copy** posts from the same path, so routing more statuses to a page there would catch a failed copy too.

## Entry Points

- API: `app/routes/shared.py` (the route and its limiter dependency), `app/utils/ratelimit.py`, `app/repositories/builds.py` (`get_public`), `app/schemas/builds.py` (`PublicBuildOut`).
- Web: `web/pages/b/[id].vue`, `web/composables/build/useSharedBuild.ts`, `web/services/shared.api.ts`, `web/services/queries/useSharedQueries.ts`, `web/components/build/BuildManager.vue` (**Share**); `HeroCard.vue`'s `readonly` prop and the controls it reaches.
- `nuxt.config.ts`: the `/b/**` route rule that turns SSR off.
- `web/app.vue`: which header controls the route shows.

## Dependencies

- Feature 005: the `builds` row this reads and the naming rule **Save a copy** inherits.
- Feature 006: the fetcher, `useAppQuery`, and the central error policy that sends a `404` here to a page.
- Feature 001: the `?build=` snapshot this is deliberately not.
- Feature 029: the open build the copy becomes, the name rule, where the copy goes, and the discard confirmation.
- Feature 004: sign-in state decides which **Save a copy** path runs, and its matrix carries the anonymous row.
- Decision 004: Neon, pooled endpoint.

## Open Questions

## Tests

- `tests/routes/test_shared.py`: the public shape carries no owner; `404` for deleted, never-existed and malformed alike; the stopgap `429` on the 61st call.
- `tests/utils/test_ratelimit.py`: capacity, refill, eviction and thread safety, against an injected clock rather than real sleeping.
- `test/nuxt/shared-build.test.ts`: the pending skeleton; a failed read raising the error page with its status and no toast; a dead link left to the central policy; a rendered build kept when a later read fails; a rendered build never read again on focus or remount, after a deletion or an edit.
- `test/nuxt/share-page.test.ts`: **Save a copy** opens the copy on `/` signed in and out, takes one click while loading, stays on failure; the header shows no build controls.
- `test/nuxt/readonly-card.test.ts`: the read-only card has no button, keeps name, level, portrait and stats, shows each power as a labelled `role="img"` glyph naming its state, and is the ordinary card with the prop off.

## Verification

By test against real PostgreSQL: no owner in the public shape, the three `404`s, the limiter under an injected clock, the skeleton and the failed read's four outcomes. `/b/[id]` is browser-verified (a Pinia Colada query in a page SFC does not activate under `mountSuspended`): live against the dev API and Auth emulator, the read-only page, the 404 after deletion, **Share** patching before copying, and a rendered build kept on refocus. Remaining risk: the limiter is per process and inert in production.
