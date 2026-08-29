# Feature: Error page

## Status

Draft

## Task Weight

Easy

## Purpose

The app has no `error.vue`, so every fatal error renders **Nuxt's** default error page. Feature 007's `/b/{id}` contract is satisfied by it — it is a page, not a toast, and it never says the build existed — but it is the framework's page: Nuxt's type, Nuxt's palette, and a heading that repeats its own body line. It is also the page an unknown route gets, where the share-link wording feature 006 supplies would be wrong.

This feature gives the app its own fatal-error page: one screen, in the project's design system, that says what went wrong at the level the caller specified and offers exactly one way out.

## Inputs

| Input               | Type                | Source                                                                | Constraints                                                                |
| ------------------- | ------------------- | --------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `error.statusCode`  | number \| undefined | Nuxt, from `createError` / an unhandled error / an unmatched route     | absent or non-numeric is possible and must render                          |
| `error.statusMessage` | string \| undefined | the `createError` call that raised it (feature 006's `showNotFoundPage`) | the caller's own wording; may be absent                                    |
| _(none else)_       | —                   | —                                                                     | the page reads no store, no localStorage, no route param, and makes no request |

## Outputs And Side Effects

| Output / Side Effect | Type   | Description                                                                             |
| -------------------- | ------ | --------------------------------------------------------------------------------------- |
| the rendered page    | screen | status code, a heading, one supporting line, one action                                 |
| "Back to the planner" | action | `clearError({ redirect: '/' })` — clears the error state and returns to the planner      |

No durable side effects: nothing is written, cleared, or reported.

## Scope And Non-Goals

In scope:

- One `error.vue` covering **every** fatal error, not only the share-link `404`.
- Two wordings, chosen by status: `404`, and everything else.
- The caller's `statusMessage` as the heading when it supplied one, so `/b/<deleted id>` still reads "Build not found" while an unknown route reads "Page not found".
- One action back to the planner.

Non-goals:

- **The app shell.** No header, no build controls, no account menu — half of them act on an active build the error page has not loaded, and `app.vue` wraps them in `ClientOnly` for hydration reasons this page has no need to inherit.
- Per-status illustration, animation, or humour.
- Error reporting, telemetry, or a retry button — a fatal error here is already terminal, and reporting is an unadopted concern (`architecture.md`).
- Any change to which statuses reach a page rather than a toast. That is feature 006's central policy and it is unchanged.

## User / System Behavior

- When a fatal error is raised, the app renders this page in place of the route, and the URL is left alone — so a dead share link still reads as the link the user clicked, and a reload retries it.
- When the status is `404`, the page shows `404`, the caller's `statusMessage` (or "Page not found" when there is none), and a line saying the page or build is not there.
- When the status is anything else, the page shows the status code (or nothing when there is none), "Something went wrong", and a line inviting a retry.
- The heading is always the caller's wording where one exists; the supporting line is always the page's own, never a second copy of the heading.
- The action returns to `/`, which is the planner, and the user's local builds are untouched by the trip.

## Roles And Access

Not role-specific. The page renders identically signed in and signed out, and reads no identity to decide anything.

## Examples

| Input                                                       | Expected Output                                                                        | Notes                                       |
| ----------------------------------------------------------- | -------------------------------------------------------------------------------------- | ------------------------------------------- |
| `/b/<deleted id>` → feature 006's `showNotFoundPage()`       | `404`, heading "Build not found", the not-there line, one action                        | statusMessage supplied by the caller        |
| `/nonsense` (no such route)                                  | `404`, heading "Page not found", the not-there line                                     | Nuxt supplies no statusMessage              |
| `createError({ statusCode: 500 })`                           | `500`, heading "Something went wrong", the retry line                                   |                                             |
| an error with no `statusCode`                                | no code shown, heading "Something went wrong", the retry line                           | must not render "undefined"                 |
| click "Back to the planner"                                  | `/` renders the planner; local builds and the active build are as they were             | `clearError` with a redirect                |
| a `404` on `/b/{id}` reached directly                        | the address bar still shows `/b/{id}`                                                   | `fatal: true` renders, never navigates      |

## Business Rules

- The `404` page **never says the build existed** — no name, no owner, no timestamp, no distinction between deleted, never-existed, and someone else's. This is feature 007's access model and it is inherited, not restated in code.
- Copy is the project's voice per `context/design-reference.md`; every token, size, and colour is `annexes/design-system.md`'s. No raw hex, no off-scale spacing.
- The page satisfies the annex's contrast and touch-target constraints (§14.1, §14.2) like any other screen.

## Edge Cases

- **No `statusCode`** — the code slot renders nothing rather than "undefined", and the generic wording applies.
- **`statusMessage` absent on a 404** — falls back to "Page not found"; the page never renders an empty heading.
- **A 404 raised on `/b/**`**, which is `ssr: false` — the page renders client-side; it holds no server-only state, so this costs nothing.
- **An error raised on the prerendered `/`** — the page must render without the app shell having mounted, which is why it depends on nothing the shell provides.
- **`statusMessage` carrying a server-supplied string** — rendered as text, never as markup.

## Invariants

- The page renders with no localStorage, no auth state, and no network access.
- It mounts nothing from `components/_shared/` that reads client-only state, so it needs no `ClientOnly` wrapper and cannot desynchronise hydration.
- The URL is never rewritten by rendering the page.
- Exactly one action, and it goes to `/`.

## Error Handling

The page is itself the error path, so it has none of its own: it takes no input that can fail and performs no action that can. A throw inside it would fall through to Nuxt's own fallback, which is the correct floor.

## Entry Points

- `web/error.vue`: the page. Nuxt renders it for any fatal error, replacing the route.
- `web/composables/useApiErrorWatcher.ts`: the one caller that raises a `404` deliberately (feature 006's `showNotFoundPage`), and the source of "Build not found".

## Dependencies

- Feature 006: the central error policy decides which statuses reach a page at all; this feature only renders what it raises.
- Feature 007: the share-link `404` is the case that motivated the page, and its "never says the build existed" rule binds the copy.
- `annexes/design-system.md`: tokens, type scale, spacing, control heights, contrast and touch-target constraints.

## Open Questions

_None._

## Tests

- `test/nuxt/error-page.test.ts`: renders the caller's `statusMessage` as the heading on a `404`; falls back to "Page not found" when it is absent; renders the generic wording for a `500`; renders no code and the generic wording when `statusCode` is absent; the heading and the supporting line are never the same string; the action calls `clearError` with a redirect to `/`.

## Verification

_Empty while this document is a draft._

## Agent Change Rules

Before changing this feature, an agent must:

1. Read this feature document.
2. Identify which documented behavior or invariant is affected.
3. Confirm the Status is `Approved` (or later), or ask the user to approve the document first.
4. Add or update tests for the changed behavior.
5. Update this document in the same change if the intended behavior changes.
6. Update `project-summary.md` if the feature summary or status changes.
