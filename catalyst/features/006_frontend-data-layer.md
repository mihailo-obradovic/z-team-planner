# Feature: Frontend data layer

## Status

Active

## Task Weight

Hard

## Purpose

The Nuxt app has never talked to an API: hero data comes from a static Nitro route via `useFetch`, and every planner value lives in `useState`. Features 004 and 005 give it a real backend. This feature is how the frontend reaches it — one fetcher, one error policy, services and query composables per resource, a single Pinia store for what no server owns — following `stacks/frontend/nuxt/` (`data-layer`, `error-handling`, `client-state`, `validation`) with the departures a bearer-token API forces written down here.

## Inputs

| Input                      | Type                  | Source                      | Constraints                                                               |
| -------------------------- | --------------------- | --------------------------- | ------------------------------------------------------------------------- |
| `NUXT_PUBLIC_API_BASE_URL` | public runtime config | build/deploy environment    | required; no default in code                                              |
| `NUXT_PUBLIC_FIREBASE_*`   | public runtime config | Firebase web app config     | `apiKey`, `authDomain`, `projectId`, `appId` — public values, not secrets |
| Firebase auth state        | `onAuthStateChanged`  | `firebase.client.ts` plugin | drives the store; `getIdToken()` per request                              |
| API responses              | JSON                  | feature 005's contract      | parsed with Zod at the service boundary, never asserted                   |
| build name                 | form field            | BuildManager dialogs        | Regle rules mirror the server: required, 1–80 after trim                  |

## Outputs And Side Effects

| Output / Side Effect   | Type         | Description                                                                                     |
| ---------------------- | ------------ | ----------------------------------------------------------------------------------------------- |
| `useAuthStore`         | Pinia store  | `status: unknown \| anonymous \| signed-in`, `user`, `activeAccountBuildId`; readonly + actions |
| query cache            | Pinia Colada | builds list, build by id, shared build — the only home of server state                          |
| toasts / inline errors | UI           | per the central policy below; `412` and `422` never toast                                       |
| `HEROES` constant      | `web/types`  | replaces `server/api/heroes.get.ts`; the `server/` directory is removed                         |

## Scope And Non-Goals

In scope:

- `@/utils/fetcher.ts`, `@/utils/handleApiError.ts`, `useAppQuery` / `useAppMutation` wrappers.
- `@/services/builds.api.ts` + `queries/useBuildQueries.ts`; `shared.api.ts` + `useSharedQueries.ts`; `me.api.ts` + `useMeQueries.ts`.
- Zod schemas for feature 005's shapes in `@/types/api.ts`; `useAuthStore`; the Firebase client plugin.
- Extending `BuildManager` with the account list and the account save path; the `/b/[id]` page; the `412` conflict dialog; the first-login offer's data path.
- Retiring the Nitro route; the eight dependency additions below.

Non-goals:

- Moving planner state out of `useState` — feature 003's keys are feature 001's serialization source and stay.
- Server-side rendering of `/b/{id}` for link previews — a later improvement under the SEO backlog item.
- Any route requiring authentication; route middleware; a `/builds` page.
- Optimistic updates or manual cache writes — invalidation only.

## User / System Behavior

- The client plugin initialises Firebase from public runtime config and subscribes `onAuthStateChanged`; the store starts `unknown` and every user-scoped query is `enabled` only at `signed-in`. The server never calls the API; nothing is forwarded.
- Every request goes through `fetcher`: `Accept: application/json`, base URL from runtime config, `credentials: 'omit'`, a generated `X-Request-ID`, and `Authorization: Bearer <getIdToken()>` when signed in. On `401` it forces `getIdToken(true)` and retries **once** via `makeRequest`, never recursively.
- `BuildManager` shows local builds and, when signed in, the account list (`useFetchBuilds`, `isPending` skeleton, `placeholderData` across refetches). Opening an account build loads its document into the planner and sets `activeAccountBuildId`; **Save** patches it with the cached `ETag`; **Save as new** creates; both invalidate `['builds']`.
- `/b/[id].vue` (`ssr: false` for `/b/**`) runs `useFetchSharedBuild`, shows a skeleton while pending, the read-only planner on success, the 404 page on `not_found`.
- The first-login offer (feature 004) calls `useImportBuilds`; its per-item report drives the summary toast.
- A `412` on save opens the conflict dialog with the server's current build: **Reload theirs** replaces the planner state and `ETag`; **Save mine as new** creates from the local state.
- A `422` on the name field renders inline through Regle's `externalErrors`; the toast is opted out for that mutation only.

## Roles And Access

Not role-specific; visibility follows the auth store (feature 004).

## Examples

| Input                                       | Expected Output                                                 | Notes                                     |
| ------------------------------------------- | --------------------------------------------------------------- | ----------------------------------------- |
| load `/` signed out                         | no API request at all                                           | queries disabled at `unknown`/`anonymous` |
| sign in                                     | `GET /me` then `GET /builds?page=1` — exactly once each         | enabled on `signed-in`                    |
| token expired mid-session, click Save       | `401` → refresh → retry → `200`; no toast                       | one retry, in `fetcher`                   |
| refresh also fails                          | store → `anonymous`, one toast                                  | second `401`                              |
| Save on a build edited elsewhere            | conflict dialog with the other device's build; no toast         | `412`, body parsed                        |
| Save as new with a 90-char name             | inline field error; no toast                                    | Regle catches it first                    |
| server-only `422` (drift in a rule)         | inline field error from `externalErrors`; no toast              | `hideValidationToast`                     |
| 21st Save as new                            | toast "You can keep up to 20 builds"                            | `409 build_limit`                         |
| open `/b/<valid id>`                        | skeleton, then the build read-only with **Save a copy**         |                                           |
| open `/b/<deleted id>`                      | 404 page                                                        | `createError`                             |
| `GET /builds` response missing `updated_at` | generic toast; Zod issue logged for developers                  | schema failure, not user error            |
| delete a build                              | list refetches; if it was active, `activeAccountBuildId` clears | invalidate `['builds']`                   |
| `NUXT_PUBLIC_API_BASE_URL` unset at build   | build fails                                                     | no default in code                        |

## Business Rules

- **Departures from `error-handling.md`, deliberate**: no cookies (`credentials: 'omit'`), no CSRF header, and the recoverable status is `401` with a Firebase token refresh instead of `419` with a cookie refresh. The retry shape is unchanged: `makeRequest`, once, guarded.
- **Central policy** (`handleApiError`): `401` after retry → `resetUser` + toast, no redirect (no route requires auth); `403` → toast; `404` → 404 page on `/b/{id}`, toast elsewhere; `409` → toast naming the limit; `412` → conflict dialog, never a toast; `422` → inline when the mutation opts out, toast otherwise; `429` → toast; other → the API's `error.message`, else a generic line. Handled errors are deduplicated with a `WeakSet`.
- **Services** are pure: one function per feature 005 endpoint, every non-void response `parseResponse(Schema, …)`, envelopes unwrapped there. **Queries** use `useAppQuery` / `useAppMutation` only; keys `builds.fetch = ['builds','fetch']`, `builds.get = ['builds','get']`, `shared.get = ['shared','get']`, `me.get = ['me']`; create, import, patch and delete invalidate `['builds']`; nothing on `/b/{id}` invalidates.
- **`If-Match`** is read from the cached build inside `useUpdateBuild`; a component never sees an `ETag`. **`Idempotency-Key`** is generated inside `useCreateBuild` / `useImportBuilds` per mutation call and reused on the fetcher's own retry.
- **Zod** schemas live in `@/types/api.ts` with types inferred from them; `SerializedBuild` keeps its hand-written type (feature 001) and the schema for `data` is `z.custom<SerializedBuild>` guarded by `v === 1` — the server already validated it. Request payload types stay hand-written.
- **Regle** owns the build-name form; rules mirror the server (`required`, `maxLength(80)` after trim); server `422`s flow through `useExternalErrors`.
- **Client state**: `useAuthStore` only, setup syntax, readonly state, actions the sole mutation path; it never fetches — the plugin and query hooks call its actions. Planner state stays in `useState`.
- **Dependencies added** (Dependency Change Rule, approved with this document): `pinia`, `@pinia/nuxt`, `@pinia/colada`, `@pinia/colada-nuxt`, `zod`, `firebase`, `@regle/core`, `@regle/rules`, `@regle/nuxt`. Not added: `@vueuse/core`.
- `useFetch` / `useAsyncData` and Nitro routes are gone from the app; the `server/` directory is deleted with the last route.

## Edge Cases

- Sign-out while a mutation is in flight: the response is discarded by the query layer's `enabled` flip; no toast.
- Two tabs, one signs out: `onAuthStateChanged` fires in both; the other tab's queries disable and its list clears without an error.
- `/b/{id}` opened by the owner: still read-only; editing happens through **My builds**.
- A `412` body that fails to parse falls through to the generic toast — the conflict dialog needs a parsed build.

## Invariants

- No component calls the network; no component holds a loading `ref`; no try-catch around a query or mutation.
- Server state lives only in the query cache; the auth store holds identity and the active build id, never a build.
- The eight planner `useState` keys are untouched by this feature.
- The fetcher retries a `401` at most once per request.

## Error Handling

- As the central policy above; schema failures log the Zod issue and toast a generic message.
- Firebase SDK failing to initialise (bad config) → store stays `unknown`, sign-in button disabled with a tooltip, console error; the anonymous app keeps working.

## Entry Points

- `web/utils/fetcher.ts`, `web/utils/handleApiError.ts`, `web/composables/useAppQuery.ts`, `useAppMutation.ts`.
- `web/services/{builds,shared,me}.api.ts`, `web/services/queries/use{Build,Shared,Me}Queries.ts`, `web/types/api.ts`.
- `web/stores/useAuthStore.ts`, `web/plugins/firebase.client.ts`.
- `web/pages/b/[id].vue`, `web/components/_shared/BuildManager.vue` (+ the conflict dialog), `web/types/hero.ts` (`HERO_STARTING_STATS`, `HEROES`).

## Dependencies

- Feature 005: every endpoint, the error schema, `ETag` / `Idempotency-Key`. Feature 004: the store's meaning, sign-in, the offer.
- Feature 002: updated in the same change — the "static Nitro endpoint" becomes an exported constant. Feature 001: unchanged; `BuildManager` gains the account list beside the local one.
- `architecture.md`: the dependency additions above are recorded there in the same change.

## Open Questions

## Tests

- `test/unit/fetcher.test.ts`: headers, base URL, the single `401` retry, no retry on the retry.
- `test/unit/handleApiError.test.ts`: every status row above, `WeakSet` dedup, the `412`/`422` non-toast paths.
- `test/unit/useBuildQueries.test.ts`: keys, `enabled` gating, invalidation awaited before the caller's `onSettled` (pinned against a slow internal hook).
- `test/nuxt/build-manager.test.ts`: account list rendering states, Save with `ETag`, conflict dialog; `test/nuxt/shared-build.test.ts`: `/b/{id}` skeleton / build / 404.

## Verification

Fourteen steps on `feature/006-frontend-data-layer`, then re-walked against feature 005's real endpoints; each commit records what it proved. All four verbs exit 0, **114 tests passing**.

By test: the single `401` retry and a persistent one stopping at two requests; every central-policy row, `412`/`422` included; query keys, `enabled` gating, invalidation awaited before the caller's hook; a 90-character name erroring inline; a response missing `updated_at` throwing generically with the Zod issue logged.

In a browser on 2026-08-26, against the real API, the Neon dev branch and the Auth emulator: a signed-out load made no request; sign-in issued exactly one `GET /builds?page=1`; **Save** patched with the cached `ETag`; a second device's save raised the conflict dialog from a real `412` with no toast, and **Reload theirs** replaced the planner state; `409` toasted the server's own limit message; `/b/{id}` rendered read-only with **Save a copy**, then the 404 page once deleted. It also found **Share** copying a `?build=` snapshot for an account build where feature 005 asks for the live link — fixed, and pinned by a test.

Unverified: `GET /me`, unconsumed until feature 004's profile menu, and sign-in through Google itself. Recorded in the tests: a Colada query inside a _page_ SFC does not activate under `mountSuspended`, so `/b/[id]` is browser-verified.

## Agent Change Rules

Before changing this feature, an agent must:

1. Read this feature document.
2. Identify which documented behavior or invariant is affected.
3. Confirm the Status is `Approved` (or later), or ask the user to approve the document first.
4. Add or update tests for the changed behavior.
5. Update this document in the same change if the intended behavior changes.
6. Update `project-summary.md` if the feature summary or status changes.
