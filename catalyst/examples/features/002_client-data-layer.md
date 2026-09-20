# Feature: Client Data Layer

Reference sample for a fictional project — **Roster**, a community sports-club membership app on the laravel + nuxt pairing. Not a real project; illustrative only. A **demonstration contract**: it documents an infrastructure pattern the app exists partly to show, deferring its rules to the stack modules (`stacks/frontend/nuxt/data-layer.md`, `error-handling.md`) and recording how the project wires them.

## Status

Active

## Task Weight

Medium

## Purpose

Give the SPA one disciplined path from component to API so data fetching, caching, response validation, and error handling are uniform and testable rather than scattered across components. Every feature that touches the backend (001–003) rides this layer.

## Inputs

| Input               | Type            | Source                              | Constraints                                                       |
| ------------------- | --------------- | ----------------------------------- | ----------------------------------------------------------------- |
| Query/mutation call | composable call | components → `use<Resource>Queries` | components never call `fetcher`/`useQuery`/`useMutation` directly |
| Request args        | typed params    | query/mutation composable           | typed against `web/types/*`                                       |
| API response        | JSON            | Laravel API via `fetcher`           | parsed through a Zod schema (`parseResponse`) before use          |

## Outputs And Side Effects

| Output / Side Effect      | Type        | Description                                                                                   |
| ------------------------- | ----------- | --------------------------------------------------------------------------------------------- |
| Query/mutation state      | reactive    | `data`/`error`/`status` from Pinia Colada, surfaced through `useAppQuery`/`useAppMutation`    |
| Cache invalidation        | side effect | mutations invalidate related keys in `onSettled` (e.g. `usersQueryKeys.fetchUsers`)           |
| Centralized error routing | side effect | `setupQueryErrorHandling` maps failures (401→login, 403→home, 422 inline/toast) once per call |

## Scope And Non-Goals

In scope: the two-layer `services/<resource>.api.ts` (pure async network functions) → `services/queries/use<Resource>Queries.ts` (Pinia Colada query/mutation composables) → component chain; the `useAppQuery`/`useAppMutation` wrappers; `fetcher.ts`; `parseResponse.ts` (Zod); central error handling (`handleApiError.ts` / `setupQueryErrorHandling.ts`).

Non-goals: the per-endpoint contracts (owned by features 001–003); client form validation UX (its own demonstration feature); client state that is not server data (the auth store); restating the stack-module rules.

## User / System Behavior

- A component calls a query/mutation composable only — e.g. `useFetchUsers()`, `useCreateUser()`. It never imports `fetcher`, `useQuery`, or `useMutation`.
- Each resource has both files: a `.api.ts` of pure functions and a `queries/use<Resource>Queries.ts` of composables. The composable calls the api function inside `useAppQuery`/`useAppMutation`.
- `useAppQuery` keeps prior data as `placeholderData` so navigating between views does not flash empty state; it wires error handling when called in a component instance.
- Mutations invalidate the affected query keys in `onSettled` (create/update/delete members all invalidate `['users','fetch']`; update/delete also invalidate `['users','get', id]`), then chain any caller-supplied `onSettled`.
- `fetcher` sends `credentials: 'include'` and a JSON `Accept`, attaches `X-XSRF-TOKEN` on state-changing methods, and on a 419 re-primes the CSRF cookie and retries exactly once.
- Responses pass through `parseResponse` against a Zod schema; a shape mismatch throws a user-presentable error rather than propagating a malformed object.

## Roles And Access

Not role-specific — the layer is transport plumbing; role gating lives in the endpoints it calls (feature 002).

## Examples

| Input                          | Expected Output                                       | Notes                                 |
| ------------------------------ | ----------------------------------------------------- | ------------------------------------- |
| `useFetchUsers()` on mount     | `UsersResponse` after Zod parse; prior data meanwhile | `placeholderData` prevents flicker    |
| `useCreateUser().mutate(form)` | member created, `['users','fetch']` invalidated       | list refetches via `onSettled`        |
| API returns 419                | CSRF cookie re-primed, request retried once           | transparent to the caller             |
| Response fails its Zod schema  | thrown presentable error, not a malformed object      | `parseResponse` is the contract guard |

## Business Rules

- Two-layer rule: every resource has a `.api.ts` and a `queries/` composable file; components consume only the composable.
- One fetcher for the whole app; one central error handler; one Zod parse per response.
- Query keys are nested arrays namespaced by resource (`usersQueryKeys`, `authQueryKeys`).

## Edge Cases

- `useFetchUser`/`GET /api/users/{id}` and its query key exist but no page consumes them (noted in feature 002) — the layer supports more than the UI currently uses.
- `useAppQuery`/`useAppMutation` only wire error handling when `getCurrentInstance()` is truthy, so calling them outside a component setup skips centralized handling.

## Invariants

- Components never call `fetcher`, `useQuery`, or `useMutation` directly — the service → query-composable → component chain is the only path to the API.
- Every server response is validated by a Zod schema before the app consumes it.
- Mutations that change server state invalidate the corresponding query keys.

No protected area of its own — the backend contracts this layer calls are protected by features 001–003 and `architecture.md`.

## Error Handling

- Central `setupQueryErrorHandling`: 401 → reset auth store + `/login`; 403 → `/home`; 422 → inline in opted-in forms else toast; other errors → generic toast. Wired once per query/mutation, not per component.
- 419 is recovered inside `fetcher` (re-prime + one retry) before it reaches the handler.

## Entry Points

- `web/services/*.api.ts` (`auth.api.ts`, `user.api.ts`) — pure network functions.
- `web/services/queries/use{Auth,User}Queries.ts` — the composables and their query keys.
- `web/composables/useAppQuery.ts`, `useAppMutation.ts` — the Pinia Colada wrappers.
- `web/utils/fetcher.ts`, `handleApiError.ts`, `setupQueryErrorHandling.ts`, `parseResponse.ts`.

## Dependencies

- Feature 001: the session/CSRF posture the fetcher assumes.
- Features 002/003: the endpoints and response envelopes this layer calls and parses.
- `@pinia/colada` for query/mutation state and cache; `zod` for response schemas.

## Open Questions

## Tests

- `web/utils/parseResponse.spec.ts`, `getValidationErrors` / `getErrorMessage` specs — the pure helpers.
- Known gaps (recorded): the api services, the query composables, `useAppQuery`/`useAppMutation`, and the `fetcher` 419-retry path have no specs.

## Verification

Frontend unit suite green (`web/utils/*.spec.ts`). The two-layer chain, wrapper behavior (placeholderData, conditional error wiring), and `onSettled` invalidation traced against source. Composable/service test gaps stand as recorded.

## Agent Change Rules

Before changing this feature, an agent must:

1. Read this feature document.
2. Identify which documented behavior or invariant is affected.
3. Confirm the Status is `Approved` (or later), or ask the user to approve the document first.
4. Add or update tests for the changed behavior.
5. Update this document in the same change if the intended behavior changes.
6. Update `project-summary.md` if the feature summary or status changes.
