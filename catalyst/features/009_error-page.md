# Feature: Error page

## Status

Active

## Task Weight

Easy

## Purpose

The app's own fatal-error page, replacing Nuxt's default: one screen, in the project's design system, that says what went wrong at the level the caller specified and offers exactly one way out. It serves a dead share link (feature 007, with the wording feature 006 supplies), a share link whose read failed, and an unknown route, where the dead link's wording would be wrong.

## Inputs

| Input                | Type                     | Source                                                                   | Constraints                                                                                                        |
| -------------------- | ------------------------ | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `error.statusCode`   | number \| undefined      | Nuxt, from `createError` / an unhandled error / an unmatched route       | absent or non-numeric is possible and must render                                                                  |
| `error.data.heading` | string \| undefined      | the `createError` call that raised it (feature 006's `showNotFoundPage`) | the caller's opted-in wording; absent for anything the app did not raise itself                                    |
| `error.data.status`  | `'unknown'` \| undefined | the `createError` call that raised it (feature 007's `useSharedBuild`)   | says the failure never had a status; `createError` turns a missing one into `500`, so absence alone cannot be seen |
| _(none else)_        | —                        | —                                                                        | the page reads no store, no localStorage, no route param, and makes no request                                     |

## Outputs And Side Effects

| Output / Side Effect  | Type   | Description                                                                         |
| --------------------- | ------ | ----------------------------------------------------------------------------------- |
| the rendered page     | screen | status code, a heading, one supporting line, one action                             |
| "Back to the planner" | action | `clearError({ redirect: '/' })` — clears the error state and returns to the planner |
| the tab title         | head   | `<heading> — Z-Team Planner`, the same heading the page shows                       |

No durable side effects: nothing is written, cleared, or reported.

## Scope And Non-Goals

In scope:

- One `error.vue` covering **every** fatal error, not only the share-link `404`.
- Two wordings, chosen by status: `404`, and everything else.
- The heading the raising caller opted into, so `/b/<deleted id>` reads "Build not found" while an unknown route reads this page's own "Page not found".
- One action back to the planner.

Non-goals:

- **The app shell.** No header, no build controls, no account menu — half of them act on an active build the error page has not loaded, and `app.vue` wraps them in `ClientOnly` for hydration reasons this page has no need to inherit.
- Per-status illustration, animation, or humour.
- Error reporting, telemetry, or a retry button — a fatal error here is already terminal, and reporting is an unadopted concern (`architecture.md`).
- Any change to which statuses reach a page rather than a toast. That is feature 006's central policy and it is unchanged.

## User / System Behavior

- When a fatal error is raised, the app renders this page in place of the route, and the URL is left alone — so a dead share link still reads as the link the user clicked, and a reload retries it.
- When the status is `404`, the page shows `404`, the caller's opted-in heading (or "Page not found" when there is none), and a line saying the page or build is not there.
- When the status is anything else, the page shows the status code (or nothing when there is none), "Something went wrong", and a line inviting a retry.
- The heading is always the caller's opted-in wording where one exists; the supporting line is always the page's own, never a second copy of the heading.
- **`statusMessage` is never displayed.** Nuxt writes it itself for an unmatched route, as `Page not found: <path>` — rendering it would reflect an arbitrary requested path into the page's own heading.
- The tab title is the page's heading followed by ` — Z-Team Planner`, with no status code, whether the error was rendered on the server or raised in the browser.
- The action returns to `/`, which is the planner, and the user's local builds are untouched by the trip.

## Roles And Access

Not role-specific. The page renders identically signed in and signed out, and reads no identity to decide anything.

## Examples

| Input                                                  | Expected Output                                                                        | Notes                                  |
| ------------------------------------------------------ | -------------------------------------------------------------------------------------- | -------------------------------------- |
| `/b/<deleted id>` → feature 006's `showNotFoundPage()` | `404`, heading "Build not found", the not-there line, one action                       | heading opted into via `data`          |
| `/nonsense` (no such route)                            | `404`, heading "Page not found", the not-there line, and no `/nonsense` anywhere on it | Nuxt's `statusMessage` is ignored      |
| `createError({ statusCode: 500 })`                     | `500`, heading "Something went wrong", the retry line                                  |                                        |
| `/b/<id>` whose read answered `503` (feature 007)      | `503`, heading "Something went wrong", the retry line                                  | raised with no opted-in heading        |
| an error raised with `data.status: 'unknown'`          | no code shown, heading "Something went wrong", the retry line                          | a read that never reached a server     |
| click "Back to the planner"                            | `/` renders the planner; local builds and the active build are as they were            | `clearError` with a redirect           |
| a `404` on `/b/{id}` reached directly                  | the address bar still shows `/b/{id}`                                                  | `fatal: true` renders, never navigates |
| `/b/<deleted id>`                                      | tab reads "Build not found — Z-Team Planner"                                           | raised in the browser                  |
| `/nonsense`                                            | tab reads "Page not found — Z-Team Planner", with no `/nonsense` in it                 | rendered on the server                 |
| `/b/<id>` whose read never reached a server            | tab reads "Something went wrong — Z-Team Planner", with no `500`                       |                                        |
| `/b/<id>` whose read answered `503`                    | tab reads "Something went wrong — Z-Team Planner", with no part of the id in it        |                                        |
| click "Back to the planner"                            | tab returns to the planner's own title                                                 |                                        |

## Business Rules

- The `404` page **never says the build existed** — no name, no owner, no timestamp, no distinction between deleted, never-existed, and someone else's. This is feature 007's access model and it is inherited, not restated in code.
- Copy is the project's voice per `context/design-reference.md`; every token, size, and colour is `annexes/design-system.md`'s. No raw hex, no off-scale spacing.
- The page satisfies the annex's contrast and touch-target constraints (§14.1, §14.2) like any other screen.

## Edge Cases

- **A failure with no status** — `createError` turns a missing `statusCode` into `500`, so the caller says `data.status: 'unknown'` and the code slot renders nothing. Without it a read that never reached a server is shown as a server fault.
- **No opted-in heading on a 404** — falls back to "Page not found"; the page never renders an empty heading.
- **A 404 raised on `/b/**`**, which is `ssr: false` — the page renders client-side; it holds no server-only state, so this costs nothing.
- **An error raised on the prerendered `/`** — the page must render without the app shell having mounted, which is why it depends on nothing the shell provides.
- **An error raised in the browser after mount** — every `/b/` failure. The title comes from a plugin watching the error state, not from this page: a head entry the page registers lands while the swap from the app shell is rendering, and the tab keeps the previous title.
- **A heading carrying a server-supplied string** — rendered as text, never as markup, and only ever one the app itself opted into.

## Invariants

- The page renders with no localStorage, no auth state, and no network access.
- It mounts nothing from `components/_shared/` that reads client-only state, so it needs no `ClientOnly` wrapper and cannot desynchronise hydration.
- The URL is never rewritten by rendering the page, and never rendered _into_ it or its tab title.
- The page and its tab title name the same heading.
- Exactly one action, and it goes to `/`.

## Error Handling

The page is itself the error path, so it has none of its own: it takes no input that can fail and performs no action that can. A throw inside it would fall through to Nuxt's own fallback, which is the correct floor.

## Entry Points

- `web/error.vue`: the page. Nuxt renders it for any fatal error, replacing the route.
- `web/utils/errorHeading.ts`: the heading, read by both the page and the tab title.
- `web/plugins/error-title.ts`: the tab title, set while an error is showing.
- `web/composables/data/useApiErrorWatcher.ts`: the one caller that raises a `404` deliberately (feature 006's `showNotFoundPage`), and the source of "Build not found".
- `web/composables/build/useSharedBuild.ts`: raises every other failure of the shared read, with its status and no heading (feature 007).

## Dependencies

- Feature 006: the central error policy decides which statuses reach a page at all; this feature only renders what it raises.
- Feature 007: the share-link `404` is the case that motivated the page, and its "never says the build existed" rule binds the copy.
- Feature 027: its SEO module's fallback title is switched off in favour of this page's own; every other route sets its own title.
- `annexes/design-system.md`: tokens, type scale, spacing, control heights, contrast and touch-target constraints.

## Open Questions

## Tests

- `test/nuxt/error-page.test.ts`: renders the caller's opted-in heading on a `404`; falls back to "Page not found" when there is none; ignores `statusMessage` so an unmatched route's path cannot reach the heading; renders the generic wording for a `500`; renders no code when the caller says the status is unknown; the heading and the supporting line are never the same string; the action calls `clearError` with a redirect to `/`.
- `test/nuxt/error-tab-title.test.ts`: the resolved tab title for an opted-in heading, an unmatched route's path, an unknown status, a `500` and a `503`.

## Verification

By test (`test/nuxt/error-page.test.ts`): the opted-in heading, both fallbacks, the ignored `statusMessage`, the unknown-status case (failing before the fix, which showed `500`), heading-never-equals-supporting-line, and `clearError({ redirect: '/' })`. oxlint, `nuxt typecheck` and oxfmt clean. In a browser against a production build and the real API: `/b/<unknown id>` gave `404` / "Build not found" with the URL still on the share link; `/nonsense` gave `404` / "Page not found" with `/nonsense` nowhere on the page; **Back to the planner** landed on `/` with the planner mounted. On local dev, `/b/<id>` with the API stopped gave "Something went wrong" with no code. Tab title: `test/nuxt/error-tab-title.test.ts` failed on all five cases before the fix (`404 -`, `404 - Page not found: /nonsense`, `500 -`); on local dev a forced `503` on `/b/<id>` titled the tab with the id before the fix, and after it the dead link, `/nonsense` (server HTML included), the unreachable API and the `503` each read `<heading> — Z-Team Planner`, and **Back to the planner** restored the planner's title. Remaining risk: a real `5xx` from the production API reaching the page is proven by a local stub only.
