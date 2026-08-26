# Feature: Account builds in the planner

## Status

Active

## Task Weight

Medium

## Purpose

What a signed-in player actually touches: account builds listed beside the local ones, opening one into the planner, saving it back, and the three moments the server disagrees — a name it will not take, a build another device already changed, an account at its limit. Feature 005 is the contract this obeys, feature 006 the layer it rides on; this is the surface between them, including the data path behind feature 004's first-login offer.

## Inputs

| Input                  | Type            | Source               | Constraints                                      |
| ---------------------- | --------------- | -------------------- | ------------------------------------------------ |
| auth status            | store           | feature 006          | account queries fire only at `signed-in`         |
| `activeAccountBuildId` | store, nullable | opening a build      | which build **Save** patches; `null` means local |
| build name             | form field      | BuildManager dialogs | Regle: required and ≤ 80, both after trim        |
| planner state          | `useState`      | feature 003          | serialized by feature 001 into the `data` sent   |
| local builds           | localStorage    | feature 001          | the offer's candidates, capped at 50             |

## Outputs And Side Effects

| Output / Side Effect        | Type    | Description                                                             |
| --------------------------- | ------- | ----------------------------------------------------------------------- |
| account build list          | UI      | in BuildManager beside local builds; skeleton while pending             |
| `POST` / `PATCH` / `DELETE` | request | create, save, remove — each invalidating `['builds']`                   |
| conflict dialog             | UI      | the other device's build, with **Reload theirs** / **Save mine as new** |
| inline field error          | UI      | a server `422` on the name, rendered on the field                       |
| import report               | UI      | the offer's per-item outcomes as one summary toast                      |

## Scope And Non-Goals

In scope:

- `builds.api.ts` and `useBuildQueries.ts` — one service function per feature 005 endpoint, one composable per operation.
- BuildManager's account list, **Save**, **Save as new**, rename and delete.
- The `412` conflict dialog; the `422`-inline name form; the `409` limit message.
- The first-login offer's data path (feature 004 owns the offer itself).

Non-goals:

- The share link and `/b/{id}` — feature 007.
- The fetcher, the central error policy, the query wrappers or the auth store — feature 006.
- Moving planner state out of `useState`: feature 003's keys are feature 001's serialization source and stay.
- Optimistic updates or manual cache writes — invalidation only.
- A dedicated `/builds` page, or any route that requires authentication.

## User / System Behavior

- Signed out, nothing here fetches: every account query is gated on the store.
- Signed in, BuildManager lists the account's builds newest-updated first — a skeleton while pending, the previous page held across refetches rather than flashing empty.
- Opening an account build loads its document into the planner and makes it active. **Save** patches it, **Save as new** creates one; both invalidate `['builds']`, refreshing the list and every cached build together.
- Deleting the active build clears the active id, so the planner is not left pointed at something gone.
- A rejected name appears **on the field**, not in a toast — whether Regle caught it or the server's `422` came back.
- Saving a build another device already changed opens the conflict dialog holding that build: **Reload theirs** replaces the planner state, **Save mine as new** keeps the local work under a new build.
- At the account limit a create toasts the server's own message, not a generic failure.
- After a first sign-in on a browser holding local builds, the offer sends the kept ones to import and reports the outcome as one summary toast; local copies are untouched.

## Roles And Access

Not role-specific. Everything here is invisible until the auth store says `signed-in`, and every route stays reachable signed out (feature 006).

## Examples

| Input                                | Expected Output                                    | Notes                       |
| ------------------------------------ | -------------------------------------------------- | --------------------------- |
| load `/` signed out                  | no account request at all                          | `enabled` gate              |
| sign in                              | `GET /builds?page=1` exactly once                  |                             |
| **Save** on a build edited elsewhere | conflict dialog with the other build; no toast     | `412`, body parsed          |
| **Save as new** with a 90-char name  | inline field error; no request                     | Regle catches it first      |
| server-only `422` (a rule drifted)   | inline field error from `externalErrors`; no toast | mutation opts the toast out |
| 21st **Save as new**                 | toast "You can keep up to 20 builds"               | `409 build_limit`           |
| delete the active build              | list refetches; `activeAccountBuildId` clears      | invalidate `['builds']`     |
| delete a non-active build            | list refetches; the active id is left alone        |                             |
| the offer imports 3, one invalid     | one summary toast naming the outcome per item      | feature 005's report        |
| a `412` whose body will not parse    | generic toast, no dialog                           | nothing to choose between   |

## Business Rules

- **Services are pure**: one function per feature 005 endpoint, no store access, no toasts, no cache writes — everything stateful lives in the composables.
- **Query keys** `builds.fetch = ['builds','fetch']`, `builds.get = ['builds','get']`; create, import, patch and delete invalidate the `['builds']` root, covering the list and every cached build at once.
- **`If-Match`** is read from the cached build inside `useUpdateBuild` — a component never sees an `ETag`.
- **`Idempotency-Key`** is generated inside `useCreateBuild` and `useImportBuilds`, once per mutation call. The fetcher's `401` retry replays the same request options, so it carries the same key and cannot create a second build.
- **Store side effects belong to the query layer**: clearing `activeAccountBuildId` on delete happens in the mutation, not in a service or component.
- **Regle** owns the name field and mirrors the server: required and at most 80, both after trimming, so a name of only spaces fails here as it would there. Feature 001's local dialogs opt out of `required` — an empty local name falls back to a generated one, unchanged here.
- Invalidation is awaited before the caller's own `onSettled` runs, so a handler that reads the list sees the refreshed one.

## Edge Cases

- A `412` body that fails its schema is not a conflict this dialog can present — with no other build there is nothing to choose between — so it falls through to the generic toast.
- Sign-out while a mutation is in flight: the response is discarded when the queries disable; no toast.
- A kept local build predating the 80-character rule costs its own row, not the whole import: feature 005 judges each item separately.
- **Save** with no active account build id is a local save: nothing on the server is pointed at.

## Invariants

- No component calls the network, holds a loading `ref`, or wraps a query in try-catch.
- No component sees an `ETag` or an `Idempotency-Key`; both are the query layer's business.
- Server state lives only in the query cache — the auth store holds identity and the active build id, never a build.
- The eight planner `useState` keys are untouched by this feature.

## Error Handling

Every status goes through feature 006's central policy; this feature only decides which mutations opt out of a toast. `412` never toasts — it opens the dialog, or falls through when the body will not parse. `422` on the name renders inline. `409` toasts the server's message. Everything else follows the policy unchanged.

## Entry Points

- `web/services/builds.api.ts`, `web/services/queries/useBuildQueries.ts`, `web/services/queries/chainOnSettled.ts`.
- `web/components/_shared/BuildManager.vue`, `web/components/_shared/BuildDialogs.vue`.
- `web/composables/useBuildDialogs.ts` (the conflict dialog's state), `web/composables/useBuildNameForm.ts`, `web/composables/useApiErrorWatcher.ts`.

## Dependencies

- Feature 005: every endpoint this calls, the naming and cap rules its messages surface, `ETag` and `Idempotency-Key` semantics.
- Feature 006: the fetcher, `useAppQuery` / `useAppMutation`, the central error policy, the auth store and the Zod schemas.
- Feature 004: the first-login offer this provides the data path for, and the meaning of `signed-in`.
- Feature 001: local builds beside the account ones, the serialization of what is sent, and the dialogs opting out of `required`.
- Feature 003: the planner state a build is loaded into and saved from.

## Open Questions

## Tests

- `test/nuxt/build-queries.test.ts`: the keys, the `enabled` gating, and invalidation awaited before the caller's `onSettled` — pinned against a slow internal hook.
- `test/nuxt/build-manager.test.ts`: the account list's rendering states, **Save** carrying the cached `ETag`, and the conflict dialog.
- `test/nuxt/build-name-form.test.ts`: the mirrored rules, trimming, and the `requireName` opt-out.

## Verification

Split out of feature 006 after it was `Active`; it adds no behavior, so the evidence is that feature's — fourteen steps on `feature/006-frontend-data-layer`, re-walked against feature 005's endpoints.

By test: query keys, `enabled` gating and invalidation ordering; a 90-character name erroring inline; the conflict dialog opening from a parsed `412` and falling through from an unparseable one. In a browser on 2026-08-26 against the real API, the Neon dev branch and the Auth emulator: a signed-out load made no request, sign-in issued exactly one `GET /builds?page=1`, **Save** patched with the cached `ETag`, a second device's save raised the conflict dialog from a real `412` with no toast, and `409` toasted the server's own limit message.

The first-login offer's import path was walked end to end when feature 004 landed: four local builds offered, two kept, two rows created and the outcome reported as one toast.

## Agent Change Rules

Before changing this feature, an agent must:

1. Read this feature document.
2. Identify which documented behavior or invariant is affected.
3. Confirm the Status is `Approved` (or later), or ask the user to approve the document first.
4. Add or update tests for the changed behavior.
5. Update this document in the same change if the intended behavior changes.
6. Update `project-summary.md` if the feature summary or status changes.
