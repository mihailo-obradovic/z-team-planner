# Feature: Share links

## Status

Active

## Task Weight

Medium

## Purpose

An account build shares by a **live** link: `/b/{id}` always shows the owner's current document, read-only, to anyone holding the link and nobody who does not. This is the public half of feature 005 — the one route reachable without a token, its unguessable-id access model, the stopgap ceiling protecting it, and the page it renders. The `?build=` snapshot link (feature 001) is a different thing, untouched.

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

- **Share** on an account build copies `https://<web>/b/{id}`. A local build has no server id, so it keeps the `?build=` snapshot instead.
- **Share** on an account build holding unsaved changes saves it first, then copies — the link resolves to the stored document, so copying before saving would hand out a build the sharer is not looking at. A save that fails copies nothing and reports itself through the central policy (a `412` opens feature 008's conflict dialog); the toast names the save, since it was not asked for explicitly.
- Every open of the link shows the owner's **current** document — an edit the owner saves is visible on the next load, with no new link. A load is opening or reloading the link; an open page never reads again, so returning to the tab or coming back from `/privacy` shows what was loaded.
- A skeleton shows while the read is pending, then the planner read-only — one `inert` region rather than a disabled prop on forty controls; the page has no write path to the owner's build at all.
- **Save a copy** creates an account build when signed in (`POST /builds`) and falls back to feature 001's local save when not. Either way the viewer gets their own copy; the owner's is untouched.
- The owner opening their own link sees the same read-only page; editing happens through **My builds**.
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
| open `/b/<valid id>`                          | skeleton, then read-only planner + **Save a copy** |                                 |
| open `/b/<deleted id>`                        | the 404 page                                       | `createError`, not a toast      |
| open `/b/<malformed id>`                      | the 404 page                                       | a dead share link like any      |
| open `/b/<id>`, the read answers `503`        | the error page: `503`, "Something went wrong"      | no toast                        |
| open `/b/<id>`, the API unreachable           | the error page, "Something went wrong"             | no toast                        |
| a build on screen, a later read answers `503` | the build stays; no page, no toast                 | nothing to lose by keeping it   |
| a build on screen, owner deletes it, refocus  | the build stays; no page, no toast; reload → 404   | no background read              |
| a build on screen, owner edits it, refocus    | the build on screen is unchanged; reload → edit    | no background read              |
| **Save a copy** signed in                     | `POST /builds`; toast names the build              | may come back suffixed (005)    |
| **Save a copy** signed out                    | a local save                                       | feature 001                     |
| **Share** on an account build                 | clipboard holds `/b/{id}`                          | live                            |
| **Share** on an account build, unsaved edits  | `PATCH` first, then `/b/{id}` copied               | link matches what is on screen  |
| that save answers `412`                       | conflict dialog; clipboard untouched               | a stale link is worse than none |
| **Share** on a local build                    | clipboard holds `?build=`                          | snapshot (001)                  |
| the owner opens their own link                | read-only planner                                  | no edit path on this page       |

## Business Rules

- **Exposure**: id, name, document and `updated_at` only — never `owner_id`, never `created_at`.
- **Access control** is the unguessable id and nothing else. No ownership check exists to fail, so there is no `403`: unknown, deleted and someone else's are one answer. A malformed id joins them — the route takes the segment as text, so a mistyped link is a `404` too and never a `422`.
- **Stopgap rate limit**: an in-process token bucket on `/shared/*`, 60 requests per minute per caller, stdlib only. It counts **per worker**, so N workers allow N × 60 and serverless instances make it inert in production (decision 007), and it keys on the socket peer, which behind a proxy is the proxy. Recorded in `operations.md`.
- **Client-rendered** (`ssr: false` for `/b/**`): the page reads a per-request id at view time, and prerendering or server-rendering it would risk serving one viewer's build to the next.
- Query key `['shared','get',id]`, no `enabled` gate on auth — the read works signed out, which is the point — and nothing here invalidates anything.
- **Never re-read while open** (`staleTime: Infinity`): focus, reconnect and a remount in the same visit all keep what was loaded. Without it a background read answering `404` would put the 404 page over a rendered build, since the central policy cannot see what is on screen.

## Edge Cases

- A `?build=` receiver who signs in gets no import offer for that snapshot — it is not one of their local builds. They use **Save a copy** like any viewer.
- **Save a copy** of a name the viewer's account already uses comes back suffixed by feature 005's naming rule; the viewer sees the name the server returned.
- A viewer already on the page when the owner deletes the build keeps what is rendered; the next load is the 404 page.
- A viewer already on the page when the owner saves an edit keeps what is rendered; the next load shows the edit.

## Invariants

- The response never carries the owner, and a build id never appears in any list an outsider can read.
- The page has no write path to the owner's build: the only mutation it can start creates a **new** one.
- Nothing on `/b/{id}` invalidates the query cache.
- The page stays `noindex, nofollow` for as long as an unlisted id is the access control.

## Error Handling

- `404` → the error page, not a toast: a dead share link is a page-level outcome, and the central policy (feature 006) routes `/b/…` that way specifically.
- Every other failure of the read — `429`, `500`, `503`, no answer, a response failing its Zod schema (still logged, feature 006) — → the error page in its generic wording, raised by `useSharedBuild` and only while no build is on screen. The read silences its own toasts, so a `429` no longer names the wait.
- Two raisers, deliberately: the central policy keys on the route path, and **Save a copy** posts from the same path, so sending more statuses to a page there would catch a failed save too.

## Entry Points

- API: `app/routes/shared.py` (the route and its limiter dependency), `app/utils/ratelimit.py`, `app/repositories/builds.py` (`get_public`), `app/schemas/builds.py` (`PublicBuildOut`).
- Web: `web/pages/b/[id].vue`, `web/composables/build/useSharedBuild.ts`, `web/services/shared.api.ts`, `web/services/queries/useSharedQueries.ts`, `web/components/build/BuildManager.vue` (**Share**).
- `nuxt.config.ts`: the `/b/**` route rule that turns SSR off.

## Dependencies

- Feature 005: the `builds` row this reads and the naming rule **Save a copy** inherits.
- Feature 006: the fetcher, `useAppQuery`, and the central error policy that sends a `404` here to a page.
- Feature 001: the local save **Save a copy** falls back to, and the `?build=` snapshot this is deliberately not.
- Feature 004: sign-in state decides which **Save a copy** path runs, and its matrix carries the anonymous row.
- Decision 004: Neon, pooled endpoint.

## Open Questions

## Tests

- `tests/routes/test_shared.py`: the public shape carries no owner; `404` for deleted, never-existed and malformed alike; the stopgap `429` on the 61st call.
- `tests/utils/test_ratelimit.py`: capacity, refill, eviction and thread safety, against an injected clock rather than real sleeping.
- `test/nuxt/shared-build.test.ts`: the pending skeleton; a failed read raising the error page with its status and no toast; a dead link left to the central policy; a rendered build kept when a later read fails; a rendered build never read again on focus or remount, after a deletion or an edit.

## Verification

By test: the public shape carrying no owner and its three `404`s — the malformed id's regression test failed with `422` before the fix — against real PostgreSQL; the limiter's capacity, refill and eviction under an injected clock; the pending skeleton, and the failed read's four outcomes, three of which failed before the fix. In a browser against the real API, the Neon dev branch and the Auth emulator: `/b/{id}` read-only with **Save a copy**, then the 404 page once the owner deleted it; **Share** on an account build holding unsaved changes issued the `PATCH` first, then copied `/b/{id}`, the planner clean afterwards and the toast naming the save. `/b/[id]` is browser-verified rather than component-verified because a Pinia Colada query inside a _page_ SFC does not activate under `mountSuspended`. On local dev after the fix: `/b/stage2probe` gave "Build not found", a well-formed id with the API stopped gave "Something went wrong" with no code, and a real build rendered read-only. After the background-read fix, whose three tests failed before it: on local dev, deleting a rendered build and refocusing the tab kept it with no new read, and a reload gave "Build not found"; an edit kept the old name on refocus and showed the new one on reload; **Privacy** and Back issued no read. Remaining risk: the limiter is per process and inert in production; a rendered build surviving a failed later read is proven by test only.
