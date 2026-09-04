# Feature: Initial load

## Status

Active

## Task Weight

Medium

## Purpose

`/` is prerendered, so the first paint is the planner holding the **default** roster — nobody's build. Hydration then runs `loadInitialBuild`, which replaces the planner state with the active local build or the one in `?build=`, while four `ClientOnly` regions mount. What the visitor watches is a complete, plausible page rearranging itself. Nothing is broken and everything moves.

This feature holds that page back instead. Until the build is loaded the app draws its chrome and its background and nothing else, with one ring saying so; then everything arrives at once, already correct. Nothing is covered over — the parts that would rearrange are not drawn yet — which is why the ground during the wait is the app's real ground rather than an imitation.

## Inputs

| Input                | Type                     | Source                           | Constraints                                                                                                  |
| -------------------- | ------------------------ | -------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| initial route        | `string`                 | `useRoute().path`, read at setup | Read once, never reactively: boot of `/` only, not a later navigation that lands there                       |
| `loadInitialBuild()` | `Promise<void>`          | `useInitialBuild`                | Already the shell's first act in `onMounted`; this feature neither adds work to it nor changes what it loads |
| reduced motion       | `prefers-reduced-motion` | the visitor's OS                 | `reduce` stops the ring's rotation; the ring itself stays                                                    |
| scripting            | `<noscript>`             | the browser                      | With scripting off nothing ever ends the wait, so a head rule ends it declaratively                          |

## Outputs And Side Effects

| Output / Side Effect | Type               | Description                                                                                                      |
| -------------------- | ------------------ | ---------------------------------------------------------------------------------------------------------------- |
| booting flag         | `<html>` attribute | Set while the app is waiting, cleared after `loadInitialBuild`. Applied by unhead, outside the tree Vue hydrates |
| hidden planner       | CSS                | `u-main` is `visibility: hidden` and cannot scroll while booting. Its markup stays; only its paint is withheld   |
| withheld chrome      | CSS                | The header's right-hand cluster and the first-run banners are not displayed while booting                        |
| ring                 | DOM element        | A fixed, transparent layer below the header holding the annex's ring, present in `/`'s prerendered HTML          |
| head `noscript`      | `<style>`          | One block undoing every rule above, in `<head>` where Vue never hydrates it                                      |
| loading ring         | annex §11 entry    | A named motion pattern, so the deferred `/b/**` splash inherits its values                                       |

## Scope And Non-Goals

In scope:

- `/` only, and only its first load.
- The ring component, the booting flag and the rules it drives, and the annex entry that settles the ring's values.

Non-goals:

- **`/b/**`.** `ssr: false`, so it paints nothing until the bundle runs — the gap Nuxt's `spaLoadingTemplate` exists for. Its own change, tracked in the issue tracker; it will cite this feature's annex entry.
- **`/privacy`.** Prerendered and static, with no client data. Already graceful.
- **What the withheld regions do.** Feature 017's banners and the header's controls are unchanged; only whether they are displayed meanwhile.
- **`AuthMenu`'s reserved slot.** It holds 93px open while sign-in is `unknown` — feature 004's decision, and what stops the header showing the wrong button. Withholding the cluster defers that empty moment past the reveal rather than removing it.
- **Route transitions.** No `NuxtLoadingIndicator`: this is boot, not navigation.
- **Waiting on anything but the build.** Not Firebase, whose cold check would add seconds, and not fonts.
- **A minimum hold.** A warm cache may show the ring for under a frame; a delay would tax every visit to smooth one.
- **A failure timeout.** If the bundle never runs the wait never ends, which is honest: ending it would reveal a planner whose controls do nothing.
- **New dependencies.** No Playwright, no browser-mode test runner.

## User / System Behavior

- Opening `/` shows the header's title, the background wash, and one ring. Nothing else, from the first paint.
- The wash is the page's own layer, seen directly rather than reproduced. It cannot differ from the loaded page's ground, because it is that ground.
- Once the planner state is loaded, the ring fades out over `--duration-baseline` and everything withheld appears together, in its final positions.
- Nothing moves at that moment. The header cluster is absent rather than reserved, so it cannot shift what is beside it; the planner is hidden rather than removed, so its arrival cannot reflow the page.
- Under `prefers-reduced-motion: reduce` the ring is drawn but does not rotate. The fade stays: it is opacity at the baseline, which §11 exempts.
- With JavaScript disabled the app renders as it did before this feature, and no ring is drawn.
- `/b/{id}` and `/privacy` are untouched, and so is a navigation into `/` from either of them.

## Roles And Access

Not role-specific. The wait is identical signed in and signed out, since waiting on auth is a non-goal.

## Examples

| Input                                     | Expected Output                                                                                 | Notes                                                       |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| `GET /`, prerendered HTML                 | The booting flag is set, the ring is present, and the planner markup is all there but unpainted | What the CDN serves, before any JS                          |
| `/` while booting                         | Title, wash and ring only; the header's right cluster and the banners are not displayed         | The wash is the page's own, at its own opacity              |
| `/` after `loadInitialBuild` resolves     | The flag clears and everything appears at once, nothing shifting                                | Save and Share moved the header row 173px before this       |
| `/` with an active local build            | The planner appears already holding it                                                          | The flip this feature exists to hide                        |
| `/` with `?build=` on a valid payload     | The planner appears in shared-build mode                                                        | A dead parameter is still stripped before the reveal        |
| `/` with no local build and no parameter  | The wait ends on the default roster                                                             | Mission templates are rolled before the snapshot, unchanged |
| `/b/{id}` or `/privacy`                   | No ring, no flag, nothing withheld                                                              | Nothing waits where nothing is prerendered stale            |
| `/` with `prefers-reduced-motion: reduce` | The ring is drawn but does not rotate; the fade still runs                                      | Annex §11, §14.4                                            |
| `/` with scripting disabled               | No ring, and every withheld region is displayed                                                 | The head block, or none of it is any use                    |

## Business Rules

- The booting flag is set by the server, by the prerender and by the first client render alike, from the same expression. It is only ever cleared **after** mount.
- Everything the flag governs is governed from one place, so a region cannot be left behind when the wait ends.
- Regions are withheld by not being displayed, never by being made invisible in place. Reserving their space would leave the empty band this rule exists to remove. The planner is the one exception: it keeps its space precisely so its arrival reflows nothing.
- The ground during the wait is never painted. Anything drawn there could drift from the real background; the real background cannot.

## Edge Cases

- **`loadInitialBuild` throws.** The wait still ends, from a `finally`, so a corrupt local build reveals the planner rather than trapping the visitor behind a ring that never stops. The `catch` beside it keeps that throw from becoming an unhandled rejection, which the suite would fail on.
- **A wheel scroll while booting.** The planner keeps its space, so it could otherwise be scrolled behind its own withheld paint; `u-main` cannot scroll until the reveal.
- **Development mode.** Nuxt serves styles through JavaScript in dev, so the withheld regions paint for an instant; production's prerendered page does not. A walk should expect that rather than read it as a defect.
- **A slow device.** The wait is the app's own time to hydrate and load the build; this feature adds no work to it. Measured to the reveal: 0.96s production, 3.5s at 4× CPU, 14s against `pnpm dev` at 4× CPU on Fast 4G, where Nuxt ships hundreds of unbundled modules. A long ring on a phone against dev is that, not a hang. Accepted: revealing sooner means revealing the wrong roster sooner.
- **A visitor with no JavaScript.** One head block undoes every boot rule at once. Undoing some but not others would hand them a half-drawn app, which is worse than either end state.
- **A crawler with no JavaScript.** Only paint is withheld, so nothing is kept from a reader that ignores CSS.
- **The account control after the reveal.** `AuthMenu` may still be `unknown` when the cluster arrives, so its 93px slot can be briefly empty — feature 004 working as designed, moved later rather than introduced here.

## Invariants

- Nothing governed by the flag is conditional on what the server cannot know. No `localStorage`, `window`, timestamp or random value decides it.
- `/`'s prerendered HTML keeps the full planner markup, and the full header markup. This feature withholds paint, never content.
- The ring sits above the planner and below every dialog, toast and banner — all of which are inside `ClientOnly` and mount after it is gone anyway.
- The wait ends for every region in one state change, in one tick.

## Error Handling

- A failed `loadInitialBuild` ends the wait and leaves the existing behaviour untouched: the leave-site prompt stays unarmed, because there is no loaded build to lose. The throw is caught and logged rather than left to become an unhandled rejection — which is what it already was, silently, before this feature. A log, not a surface: nothing is shown to the visitor.
- No timeout, no retry, no fallback copy. See Non-Goals.

## Entry Points

- `web/app.vue`: owns the booting state, the `onMounted` sequence it already ran, and the head entries.
- `web/components/_shared/LoadingRing.vue`: the ring and the layer that centres it.
- `web/assets/css/main.css`: the boot rules keyed off the flag, the ring's keyframes, and its reduced-motion guard.
- `catalyst/annexes/design-system.md` §11: the ring as a named pattern.

## Dependencies

- `useInitialBuild` (feature 001, feature 015): the promise the wait hangs on.
- Feature 010: `/`'s `prerender: true` route rule is the reason there is stale content to withhold at all.
- Feature 004 and feature 017: the account control's reserved slot and the first-run banners, both deferred past the reveal rather than changed.
- The design-system annex: tokens, durations, the z-scale, and the reduced-motion rule.

## Open Questions

None.

## Tests

- `test/nuxt/initial-load.test.ts`:
  - the ring renders on `/` and is gone once `loadInitialBuild` has resolved;
  - a rejected `loadInitialBuild` still ends the wait, and reports;
  - the booting flag governs the planner, the header cluster and the banners together, and clears in one tick;
  - `/b/{id}` and `/privacy` never wait.

Vitest's Nuxt environment mounts client-side and never hydrates, so it cannot prove the absence of a mismatch. That is what the browser walk is for.

## Verification

Suite 383 passing across 48 files, typecheck, lint, format and build clean. The built `/` serves `data-booting="true"`, the ring, the withheld wrapper and the head block; `/privacy` serves no flag. Both boot rules and the reduced-motion guard ship in the stylesheet.

Walked in Chrome on the preview and a dev server, which caught a defect the tests could not: unhead does **not** remove an `<html>` attribute inherited from SSR when its value resolves to `undefined`, so the flag stuck on and the app stayed hidden. The unit test passed regardless, because in happy-dom that attribute is client-written and so removable. Fixed by giving the flag two values rather than one and an absence.

Measured after the fix: flag `false`, `main` visible and scrollable, cluster displayed, sixteen portraits; with the flag forced on, `main` hidden but keeping its 823px of height, cluster not displayed, wash showing through. Dev `/` loads with no console warning, which is where Vue reports a mismatch. `/privacy` and `/b/{id}` are untouched.

Reduced motion and scripting-disabled were read from the stylesheet and served HTML; the browser tool emulates neither.

## Agent Change Rules

Before changing this feature, an agent must:

1. Read this feature document.
2. Identify which documented behavior or invariant is affected.
3. Confirm the Status is `Approved` (or later), or ask the user to approve the document first.
4. Add or update tests for the changed behavior.
5. Update this document in the same change if the intended behavior changes.
6. Update `project-summary.md` if the feature summary or status changes.
