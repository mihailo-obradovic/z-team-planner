# Feature: Portrait loading

## Status

Approved

## Task Weight

Medium

## Purpose

A portrait in a later tab or the dialog used to start downloading only when it came into view, then cut in over its empty box one at a time, in whatever order the network finished — with the alt text showing in the box until then. This feature owns how a portrait arrives on screen: when it loads, what stands in its place meanwhile, and how it appears.

What is served — masters, widths, format, cache — stays feature 021's. The terms are the glossary's (`context/glossary.md`, Roster imagery): **portrait**, and **portrait fade-in**.

## Inputs

| Input            | Type                      | Source                    | Constraints                                                                                                  |
| ---------------- | ------------------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------ |
| usage loading    | `PORTRAIT_LOADING[usage]` | `web/config/portraits.ts` | `eager` for `card` only, the landing tab's first pairs; `lazy` for every other usage                         |
| tab width        | CSS px                    | the planner's tab wrapper | the same `@container` the synergy card reflows on (feature 014); picks the synergy portrait's usage at 58rem |
| page load + idle | browser events            | the planner page `/`      | the background download's start; never before the window's `load`                                            |
| shown hero form  | shared state              | feature 012               | Sonar's portrait follows the form shown now; only that form is downloaded ahead                              |
| reduced motion   | media query               | the visitor's OS          | `prefers-reduced-motion: reduce` drops the fade-in                                                           |

## Outputs And Side Effects

| Output / Side Effect | Type          | Description                                                                                                                           |
| -------------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| portrait fade-in     | rendered      | opacity from 0 to the portrait's own, `--duration-slow`, `ease-out` (annex §11, named pattern)                                        |
| background download  | HTTP requests | after load and idle on `/`, at low priority, the exact variants the browser would pick for the synergy tab and the dialog's portraits |

## Scope And Non-Goals

In scope:

- `HeroPortrait`'s loading behavior: the empty box, the hidden alt text, the fade-in, the instant show when already loaded.
- The background download on `/`, and the synergy portrait's width following the tab's 58rem threshold.
- Moving 021's per-usage loading table here.

Non-goals:

- Holding feature 023's loading ring for portraits. The planner reveals when the app is ready; portraits fade in as they land.
- A blurred preview or a pulsing skeleton: the empty box is the placeholder, and with the download ahead it is rarely seen.
- Downloading ahead on `/b/**`. A shared build is mostly looked at; its dialog portrait fades in when opened.
- Downloading ahead the mission simulator's tiles, or Sonar's other form (it fades in on its first toggle).

## User / System Behavior

- **While loading**, a portrait is its sized box in the usage site's own background, with no alt text painted in it. Screen readers still get the hero's name.
- **On load**, the portrait fades in over its box: opacity only, `--duration-slow`, `ease-out`, ending at whatever opacity the site gives it (an illusion slot's 40% stays 40%). Each portrait fades on its own load; nothing waits for a group.
- **Already loaded** — the browser holds that exact variant when the portrait mounts or its source changes — it shows at once, with no fade-in. Reopening the dialog on a seen hero, or switching back to a tab, never replays it.
- **Under reduced motion** a loaded portrait shows at once; only the motion is dropped, never the content.
- **On failure**, the box shows the hero's name as the browser's alt text. No retry.
- **Background download.** On `/`, once the window has loaded and the browser is next idle, one low-priority batch requests, in order: the synergy tab's portraits at the width the current tab would render, then the dialog's portraits for every hero — header, panel, rail and ribbon. Each request is the variant the browser would pick for that site at the device's pixel ratio, so a later render is a cache hit. It runs once per page load.
- **Synergy width.** Below a 58rem tab the synergy portrait renders at 108px and declares `card`, the variant the overview already loaded; from 58rem it declares `synergy`. A hidden tab measures 0 and declares `card`. Crossing the threshold, the first showing of a wide tab included, upgrades the portrait in place: the browser keeps the smaller variant on screen until the larger has loaded, with no fade-in.

## Roles And Access

Not role-specific.

## Examples

| Input                                                | Expected Output                                                       | Notes                                 |
| ---------------------------------------------------- | --------------------------------------------------------------------- | ------------------------------------- |
| cold load of `/`, wait 2 s, open the synergy tab     | every synergy portrait shows at once, no fade-in                      | downloaded in the background          |
| same, switching before the background batch finishes | portraits already in show at once; the rest fade in as each lands     | no group wait                         |
| tab wrapper at 900px, open the synergy tab           | portraits request `w=108`/`w=216`, both cache hits from the overview  | below 58rem                           |
| a portrait still loading (throttled network)         | the box shows, no alt text inside it                                  | `alt` still in the accessibility tree |
| it finishes loading                                  | 250 ms opacity fade over the box                                      |                                       |
| same under `prefers-reduced-motion: reduce`          | appears at once                                                       |                                       |
| open the dialog on a hero, close, open it again      | first open: no fade-in if the batch ran; second open: never a fade-in | already loaded                        |
| a portrait request fails                             | the box shows the hero's name                                         | browser alt rendering                 |
| an illusion slot's portrait loads                    | fades to 40%, not 100%                                                | ends at the site's own opacity        |
| cold load of `/b/{id}`                               | no background requests for synergy or dialog portraits                | planner page only                     |

## Business Rules

- The fade-in, the hidden alt text and the already-loaded check live in `HeroPortrait`, never at a usage site.
- The background batch requests exactly what the sites will render — same URL, same density — or it is wasted bandwidth on a free-tier optimizer.
- The synergy portrait picks its usage from the same 58rem container threshold its card reflows on; a width outside `PORTRAIT_WIDTHS` is never introduced.

## Edge Cases

- The synergy tab is hidden (`display: none`) at load, so its own width is zero: the batch reads the visible tab wrapper's width, which is the same box.
- The dialog's rail and ribbon both mount and CSS shows one; the batch requests both, since each is a few kilobytes.
- A portrait whose source changes while still fading restarts from its box for the new source, or shows at once if that one is loaded.
- A browser without an idle callback starts the batch on a short timeout after `load` instead.

## Invariants

- No portrait request, other than the overview cards', is made before the window's `load` on `/`.
- A loaded portrait never fades in a second time while its source is unchanged.
- Every portrait still renders through `HeroPortrait`, at a width in `PORTRAIT_WIDTHS` (feature 021).

## Error Handling

- A failed portrait shows its alt text in the box; a failed background request is ignored, and the site retries naturally when it renders.

## Entry Points

- `web/components/hero/HeroPortrait.vue` — the box, the alt handling, the fade-in.
- `web/config/portraits.ts` — `PORTRAIT_LOADING`.
- `web/components/synergy/SynergyHeroPortrait.vue` — the width chosen from the tab threshold.
- A background-download composable started from `web/pages/index.vue`; the fade-in class in `web/assets/css/motion.css`.

## Dependencies

- `features/021_hero-portraits.md` — the widths, densities and URLs this feature loads.
- `features/014_synergy-pairs-tab.md` — the 58rem threshold.
- `features/011_hero-detail-dialog.md`, `features/019_roster-follow.md` — the dialog's portraits.
- `features/012_special-powers.md` — Sonar's form.
- `features/023_initial-load.md` — the reveal, which does not wait for portraits.
- `annexes/design-system.md` §10 placeholder, §11 portrait fade-in.

## Open Questions

## Tests

- `HeroPortrait`: alt text hidden while loading and shown on error; fade-in class only when not already complete; none under reduced motion.
- The batch: nothing before `load`; synergy before dialog; the requested URLs equal the rendered `srcset` candidates; nothing on `/b/**`.
- `SynergyHeroPortrait`: `card` below 58rem, `synergy` from 58rem.

## Verification
