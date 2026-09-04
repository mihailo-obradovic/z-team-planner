# Feature: Initial load

## Status

Approved

## Task Weight

Medium

## Purpose

`/` is prerendered, so the first paint is the planner holding the **default** roster — nobody's build. Hydration then runs `loadInitialBuild`, which replaces the whole planner state with the active local build or the one in `?build=`, and four `ClientOnly` regions mount at the same moment. What the visitor watches is a complete, plausible page rearranging itself: budgets jump, allocations appear, the build's name arrives in a header control that was not there a frame earlier. Nothing is broken and everything moves.

This feature covers that window with one opaque surface, so the planner is seen once, already correct. The prerendered markup stays exactly as it is underneath — the cover is drawn by the same prerender, so the server's HTML, the first client render and the hydrated DOM are the same tree, which is the whole reason this is an overlay and not a `v-if` around `NuxtPage`.

## Inputs

| Input                | Type                     | Source                           | Constraints                                                                                                                                  |
| -------------------- | ------------------------ | -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| initial route        | `string`                 | `useRoute().path`, read at setup | Read once, never reactively: the cover belongs to the boot of `/`, not to any later navigation that lands on it                              |
| `loadInitialBuild()` | `Promise<void>`          | `useInitialBuild`                | Already the shell's first act in `onMounted`; this feature adds no new work to it and does not change what it loads                          |
| reduced motion       | `prefers-reduced-motion` | the visitor's OS                 | `reduce` stops the ring's rotation; the ring itself, and the cover, stay                                                                     |
| scripting            | `<noscript>`             | the browser                      | With scripting off the cover never lifts, so it is hidden outright and the prerendered planner is what the visitor gets — as it is on master |

## Outputs And Side Effects

| Output / Side Effect  | Type            | Description                                                                                                                         |
| --------------------- | --------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| cover                 | DOM element     | Fixed, opaque, spanning the viewport below the header; present in `/`'s prerendered HTML and removed after `loadInitialBuild`       |
| `inert` + `aria-busy` | attributes      | On `u-main` while covered, so the hidden planner is out of the tab order and announced as busy rather than read out behind a screen |
| head `noscript`       | `<style>`       | One rule hiding the cover, emitted into `<head>` where Vue never hydrates it                                                        |
| loading ring          | annex §11 entry | A third named motion pattern, so the deferred `/b/**` splash inherits the values instead of re-deciding them                        |

## Scope And Non-Goals

In scope:

- `/` only, and only its first load.
- The cover component, its ring, the `u-main` attributes, and the annex entry that settles the ring's values.

Non-goals:

- **`/b/**`.** It is `ssr: false` and paints nothing until the bundle runs, which is the gap Nuxt's `spaLoadingTemplate` exists for — a different mechanism, an inline-CSS file with literal colours, and its own change. Tracked in the issue tracker; the annex entry this feature writes is what that file will cite.
- **`/privacy`.** Prerendered, static, no client data. Already graceful.
- **The `ClientOnly` pop-in as its own problem.** The cover hides it on `/` because it hides everything on `/`; nothing about those four regions changes.
- **Route transitions.** No `NuxtLoadingIndicator`; this is boot, not navigation.
- **Waiting on anything but the build.** Not Firebase — `AuthMenu` already holds a reserved slot for it (feature 004) and a cold sign-in check would hold the cover for seconds. Not fonts.
- **A minimum hold.** A returning visitor with a warm cache may see the cover for under a frame; an artificial delay would tax every visit to smooth one.
- **A failure timeout.** If the bundle never runs the cover never lifts, and that is the honest signal — lifting it would reveal a planner whose controls do nothing.
- **New dependencies.** No Playwright, no browser-mode test runner.

## User / System Behavior

- Opening `/` shows the header, and below it a plain ground carrying one ring, from the first paint.
- Once the planner state is loaded, the cover fades out over `--duration-baseline` and is removed. The planner is revealed already holding the visitor's build.
- Under `prefers-reduced-motion: reduce` the ring is drawn but does not rotate. The fade stays: it is opacity at the baseline, which §11 exempts.
- With JavaScript disabled the cover is not shown at all.
- Opening `/b/{id}` or `/privacy` never shows the cover.
- Navigating to `/` from another route after boot never shows the cover.

## Roles And Access

Not role-specific. The cover is identical signed in and signed out — deliberately, since waiting on auth is a non-goal.

## Examples

| Input                                     | Expected Output                                                      | Notes                                                       |
| ----------------------------------------- | -------------------------------------------------------------------- | ----------------------------------------------------------- |
| `GET /`, prerendered HTML                 | Cover element present; `main` carries `inert` and `aria-busy="true"` | This is what the CDN serves, before any JS                  |
| `/` after `loadInitialBuild` resolves     | Cover gone; `inert` and `aria-busy` gone from `main`                 | One tick, all three together                                |
| `/` with an active local build            | Planner is revealed already holding that build                       | The flip this feature exists to hide                        |
| `/` with `?build=` on a valid payload     | Planner is revealed in shared-build mode                             | `useInitialBuild` also strips a dead parameter before lift  |
| `/` with no local build and no parameter  | Cover lifts on the default roster                                    | Mission templates are rolled before the snapshot, unchanged |
| `/b/{id}`                                 | No cover; the page's own skeleton as today                           | Out of scope by decision                                    |
| `/privacy`                                | No cover                                                             | Static page                                                 |
| `/` with `prefers-reduced-motion: reduce` | Ring drawn, not rotating; fade still runs                            | Annex §11, §14.4                                            |
| `/` with scripting disabled               | No cover; the prerendered planner is readable                        | Head `noscript` rule                                        |

## Business Rules

- The cover is rendered by the server, by the first client render, and by the prerender, from the same expression. It is only ever removed **after** mount.
- Removal is one state change: cover, `inert` and `aria-busy` go together.
- The ring's values are the annex's, not the component's invention.
- The cover is opaque. A translucent cover would show the rearrangement it exists to hide.

## Edge Cases

- **`loadInitialBuild` throws.** The cover still lifts. Its `finally` is what clears the state, so a corrupt local build reveals the planner rather than trapping the visitor behind a permanent ring.
- **A wheel scroll while covered.** `inert` blocks pointer and keyboard input but not scrolling the region underneath, so `u-main` also carries `overflow-hidden` while covered; it would otherwise lift onto a page scrolled somewhere the visitor never chose.
- **Development mode.** Nuxt serves styles through JavaScript in dev, so the cover paints unstyled for an instant there. In production the prerendered page carries a render-blocking stylesheet link and does not. The manual walk needs to expect that difference rather than read it as a defect.
- **The background wash.** It is `fixed inset-0` behind everything; the cover paints over it and reveals it at lift. That reveal is part of the transition, not a flash to fix.

## Invariants

- Nothing in the covered tree is conditional on anything the server cannot know. No `localStorage`, no `window`, no timestamp, no random value decides whether the cover renders.
- `/`'s prerendered HTML keeps the full planner markup. The cover never replaces content; it sits above it.
- The cover is above `u-main`'s `z-10` and below nothing else that matters — no dialog, toast or banner can open while it is up, because they are all inside `ClientOnly` and mount after it lifts.

## Error Handling

- A failed `loadInitialBuild` lifts the cover and leaves the existing behaviour untouched — this feature adds no error surface of its own.
- No timeout, no retry, no fallback copy. See Non-Goals.

## Entry Points

- `web/app.vue`: owns the cover's state, the `onMounted` sequence it already ran, and the `u-main` attributes.
- `web/components/_shared/LoadingCover.vue`: the cover and its ring.
- `web/assets/css/main.css`: the ring's keyframes and its reduced-motion guard, beside `tab-fade`.
- `catalyst/annexes/design-system.md` §11: the ring as a named pattern.

## Dependencies

- `useInitialBuild` (feature 001, feature 015): the promise the cover waits on.
- Feature 010: `/`'s `prerender: true` route rule is why an overlay is the shape rather than a gate.
- Feature 004: `AuthMenu`'s reserved slot is why auth is not waited on.
- The design-system annex: tokens, durations, and the reduced-motion rule.

## Open Questions

None.

## Tests

- `test/nuxt/initial-load.test.ts`:
  - the cover renders on the first render of `/`, with `main` carrying `inert` and `aria-busy`;
  - all three are gone once `loadInitialBuild` has resolved;
  - a rejected `loadInitialBuild` still lifts the cover;
  - no cover on `/b/{id}` or `/privacy`.

Vitest's Nuxt environment mounts client-side and never performs a real hydration, so it cannot prove the absence of a mismatch. That is what the manual walk below is for, and why it is named here rather than assumed.

## Verification

Empty while the document is a draft.

## Agent Change Rules

Before changing this feature, an agent must:

1. Read this feature document.
2. Identify which documented behavior or invariant is affected.
3. Confirm the Status is `Approved` (or later), or ask the user to approve the document first.
4. Add or update tests for the changed behavior.
5. Update this document in the same change if the intended behavior changes.
6. Update `project-summary.md` if the feature summary or status changes.
