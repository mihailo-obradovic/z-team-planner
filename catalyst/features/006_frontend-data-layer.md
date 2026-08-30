# Feature: Frontend data layer

## Status

Active

## Task Weight

Hard

## Purpose

The Nuxt app has never talked to an API: hero data comes from a static Nitro route via `useFetch`, and every planner value lives in `useState`. Features 004 and 005 give it a real backend. This feature is the layer that reaches it and the conventions every resource on top of it follows — one fetcher, one error policy, the query and mutation wrappers, Zod at the boundary, and a single Pinia store for what no server owns. It follows `stacks/frontend/nuxt/` (`data-layer`, `error-handling`, `client-state`, `validation`) with the departures a bearer-token API forces written down here. Features 007 and 008 are the two resource surfaces built on it.

## Inputs

| Input                      | Type                  | Source                      | Constraints                                                               |
| -------------------------- | --------------------- | --------------------------- | ------------------------------------------------------------------------- |
| `NUXT_PUBLIC_API_BASE_URL` | public runtime config | build/deploy environment    | optional; empty means no API is deployed and sign-in is unavailable       |
| `NUXT_PUBLIC_FIREBASE_*`   | public runtime config | Firebase web app config     | `apiKey`, `authDomain`, `projectId`, `appId` — public values, not secrets |
| Firebase auth state        | `onAuthStateChanged`  | `firebase.client.ts` plugin | drives the store; `getIdToken()` per request                              |
| API responses              | JSON                  | feature 005's contract      | parsed with Zod at the service boundary, never asserted                   |

## Outputs And Side Effects

| Output / Side Effect   | Type         | Description                                                                                     |
| ---------------------- | ------------ | ----------------------------------------------------------------------------------------------- |
| `useAuthStore`         | Pinia store  | `status: unknown \| anonymous \| signed-in`, `user`, `activeAccountBuildId`; readonly + actions |
| query cache            | Pinia Colada | the only home of server state; one key namespace per resource                                   |
| toasts / inline errors | UI           | per the central policy below; `412` and `422` never toast                                       |
| `HEROES` constant      | `web/types`  | replaces `server/api/heroes.get.ts`; the `server/` directory is removed                         |

## Scope And Non-Goals

In scope:

- `@/utils/fetcher.ts`, `@/utils/handleApiError.ts`, the `useAppQuery` / `useAppMutation` wrappers.
- The service-and-query shape every resource follows, and the key and invalidation conventions.
- `me.api.ts` + `queries/useMeQueries.ts` — the profile read, and the only resource this feature owns outright.
- Zod schemas for feature 005's shapes in `@/types/api.ts`; `useAuthStore`; the Firebase client plugin.
- Retiring the Nitro route; the nine dependency additions below.

Non-goals:

- Moving planner state out of `useState` — feature 003's keys are feature 001's serialization source and stay.
- The share link and its page — feature 007. The account-builds surface, its dialogs and its name form — feature 008.
- Any route requiring authentication; route middleware; a `/builds` page.
- Optimistic updates or manual cache writes — invalidation only.

## User / System Behavior

- The client plugin initialises Firebase from public runtime config and subscribes `onAuthStateChanged`; the store starts `unknown` and every user-scoped query is `enabled` only at `signed-in`. The server never calls the API; nothing is forwarded.
- Every request goes through `fetcher`: `Accept: application/json`, base URL from runtime config, `credentials: 'omit'`, a generated `X-Request-ID`, and `Authorization: Bearer <getIdToken()>` when signed in. On `401` it forces `getIdToken(true)` and retries **once** via `makeRequest`, never recursively.
- A query keeps its previous data visible across a key change rather than flashing empty, and every failure — query or mutation — goes through the one central policy instead of a try-catch at the call site.
- A mutation may opt out of the toast for a status it handles itself; that is the only sanctioned way to bypass the policy, and features 007 and 008 are its callers.

## Roles And Access

Not role-specific; visibility follows the auth store (feature 004).

## Examples

| Input                                      | Expected Output                                         | Notes                                     |
| ------------------------------------------ | ------------------------------------------------------- | ----------------------------------------- |
| load `/` signed out                        | no API request at all                                   | queries disabled at `unknown`/`anonymous` |
| sign in                                    | `GET /me` then `GET /builds?page=1` — exactly once each | enabled on `signed-in`                    |
| token expired mid-session, click Save      | `401` → refresh → retry → `200`; no toast               | one retry, in `fetcher`                   |
| refresh also fails                         | store → `anonymous`, one toast                          | second `401`                              |
| a mutation that opts the toast out         | no toast; the caller renders the error itself           | `suppressToasts: 'validation'`            |
| a response missing a schema-required field | generic toast; Zod issue logged for developers          | schema failure, not user error            |
| a query's key changes                      | previous data stays visible until the new data lands    | no empty flash                            |
| `useAppQuery` called outside a component   | no-op rather than a thrown error                        |                                           |
| `NUXT_PUBLIC_API_BASE_URL` empty at build  | sign-in disabled, Firebase never initialised            | frontend-only deployment (decision 007)   |

## Business Rules

- **Departures from `error-handling.md`, deliberate**: no cookies (`credentials: 'omit'`), no CSRF header, and the recoverable status is `401` with a Firebase token refresh instead of `419` with a cookie refresh. The retry shape is unchanged: `makeRequest`, once, guarded.
- **Central policy** (`handleApiError`): `401` after retry → `resetUser` + toast, no redirect (no route requires auth); `403` → toast; `404` → 404 page on `/b/{id}`, toast elsewhere; `409` → toast naming the limit; `412` → conflict dialog, never a toast; `422` → inline when the mutation opts out, toast otherwise; `429` → toast; other → the API's `error.message`, else a generic line. Handled errors are deduplicated with a `WeakSet`.
- **Services** are pure: one function per endpoint, no store access, no toasts, no cache writes, every non-void response through `parseResponse(Schema, …)` with the envelope unwrapped there. **Queries** use `useAppQuery` / `useAppMutation` only, never Colada directly. Each resource owns a key namespace under its own root — `me.get = ['me']` here, `['builds']` in feature 008, `['shared']` in feature 007 — and a mutation invalidates its resource's root rather than picking individual keys. Invalidation is awaited before the caller's own `onSettled`.
- **Protocol headers never reach a component**: an `ETag` or an `Idempotency-Key` is the query layer's business, read from the cache or generated inside the mutation (feature 008).
- **Zod** schemas live in `@/types/api.ts` with types inferred from them; `SerializedBuild` keeps its hand-written type (feature 001) and the schema for `data` is `z.custom<SerializedBuild>` guarded by `v === 1` — the server already validated it. Request payload types stay hand-written.
- **Regle** is the form library, and a form's rules mirror the server's so the client rejects what the server would; a server `422` flows back onto the field through `externalErrors` (feature 008).
- **Client state**: `useAuthStore` only, setup syntax, readonly state, actions the sole mutation path; it never fetches — the plugin and query hooks call its actions. Planner state stays in `useState`.
- **Dependencies added** (Dependency Change Rule, approved with this document): `pinia`, `@pinia/nuxt`, `@pinia/colada`, `@pinia/colada-nuxt`, `zod`, `firebase`, `@regle/core`, `@regle/rules`, `@regle/nuxt` — nine, recorded in `architecture.md` against this feature. Not added: `@vueuse/core`.
- `useFetch` / `useAsyncData` and Nitro routes are gone from the app; the `server/` directory is deleted with the last route.

## Edge Cases

- Sign-out while a mutation is in flight: the response is discarded by the query layer's `enabled` flip; no toast.
- Two tabs, one signs out: `onAuthStateChanged` fires in both; the other tab's queries disable and its list clears without an error.
- `useAppQuery` called outside a component setup is a no-op, not a throw — a composable reached from the wrong place fails quietly rather than taking the page down.

## Invariants

- No component calls the network; no component holds a loading `ref`; no try-catch around a query or mutation.
- Server state lives only in the query cache; the auth store holds identity and the active build id, never a build, and actions are its only mutation path.
- The eight planner `useState` keys are untouched by this feature.
- The fetcher retries a `401` at most once per request.

## Error Handling

- As the central policy above; schema failures log the Zod issue and toast a generic message.
- Firebase SDK failing to initialise (bad config) → store stays `unknown`, sign-in button disabled with a tooltip, console error; the anonymous app keeps working.

## Entry Points

- `web/utils/fetcher.ts`, `web/utils/handleApiError.ts`, `web/composables/useAppQuery.ts`, `useAppMutation.ts`.
- `web/services/me.api.ts`, `web/services/queries/useMeQueries.ts`, `web/services/queries/chainOnSettled.ts`, `web/types/api.ts`.
- `web/stores/useAuthStore.ts`, `web/plugins/firebase.client.ts`.
- `web/types/hero.ts` (`HERO_STARTING_STATS`, `HEROES`) — what the retired Nitro route used to serve.

## Dependencies

- Feature 005: the endpoints these conventions are written against, the error schema, `ETag` / `Idempotency-Key`. Feature 004: the store's meaning, sign-in, the offer.
- Features 007 and 008 are the consumers: every rule here is a rule they follow, and a change to the fetcher, the policy or the key convention is a change to both.
- Feature 002: updated in the same change — the "static Nitro endpoint" becomes an exported constant. Feature 001: unchanged.
- `architecture.md`: the dependency additions above are recorded there in the same change.

## Open Questions

## Tests

- `test/unit/fetcher.test.ts`: headers, base URL, the single `401` retry, no retry on the retry.
- `test/unit/handleApiError.test.ts`: every status row above, `WeakSet` dedup, the `412`/`422` non-toast paths.
- `test/nuxt/app-query.test.ts`: previous data held across a key change, failures routed through the policy for both query and mutation, the toast opt-out, and the outside-a-component no-op.
- `test/nuxt/auth-store.test.ts`: the `unknown` start, both resolutions, the active build cleared on sign-out and kept across an ordinary update, the SDK-failure state, and a direct write being ignored.

## Verification

Fourteen steps on `feature/006-frontend-data-layer`, then re-walked against feature 005's real endpoints; each commit records what it proved. All four verbs exit 0, **114 tests passing**.

By test: the single `401` retry, and a persistently failing one stopping at two requests rather than recursing; every row of the central policy, the `412` and `422` non-toast paths included, with `WeakSet` dedup; previous data held across a key change; the store's `unknown` start, both resolutions, and actions as its only mutation path. In a browser on 2026-08-26 against the real API, the Neon dev branch and the Auth emulator: a signed-out load made no request at all, and sign-in issued exactly one call per user-scoped query.

Unverified: `GET /me`, unconsumed until feature 004's profile menu, and sign-in through Google itself. Recorded in the tests: a Pinia Colada query inside a _page_ SFC does not activate under `mountSuspended`, which is why feature 007's page is browser-verified.

The surfaces built on this layer carry their own evidence — features 007 and 008.

## Agent Change Rules

Before changing this feature, an agent must:

1. Read this feature document.
2. Identify which documented behavior or invariant is affected.
3. Confirm the Status is `Approved` (or later), or ask the user to approve the document first.
4. Add or update tests for the changed behavior.
5. Update this document in the same change if the intended behavior changes.
6. Update `project-summary.md` if the feature summary or status changes.
