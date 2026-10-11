# Decision: Pass Core Web Vitals on a phone — first load, share page, interactions

## Status

Implemented

## Type

performance

## Task Weight

Hard

## Context

The 2026-10-06 baseline (Workflowy, Performance map 055d42c1) measured production against the Core Web Vitals good thresholds, mobile throttled, signed out. Desktop passes everywhere. Mobile fails LCP on `/` (5.6 s) and `/b/{id}` (5.5 s), and three interactions fail INP at 4× CPU: dialog open 970 ms, synergy tab 581 ms, level-up ≈250 ms.

The causes differ. On `/`, feature 023 holds the first paint until `loadInitialBuild` resolves, and that waits on one 315 KB brotli entry chunk carrying every surface: dialogs, drawers, mission panels, forms, Firebase. Nothing is lazy. On `/b/{id}` the chain is serial: HTML, entry, then the API request, then the LCP portrait; the API cold start is 5.7 s, ~4.3 s of it Python function boot. The interactions are app-shaped: one global special-power computed re-renders every card on a Flambae, Coupé or Golem point; ScrollRegion measures on mount mid-layout; the synergy panel mounts under Reka's indicator read.

## Decision

Keep every shipped guarantee and move the cost. Three groups, each on its own branch, merged after its own Lighthouse pass; this record flips to `Implemented` after the third.

**A — first load on `/`.** Every user-opened surface becomes a lazy chunk behind a `v-if` on its open or active state; header, overview cards and tab bar stay in entry. Lazy chunks preload on idle after the reveal and on hover or focus of their trigger. Firebase leaves the anonymous path: a `z-team-session` localStorage marker is written at `signed-in` and removed at `anonymous`; without it the store resolves `anonymous` at boot and the SDK is imported only on a stored session or a Sign-in click, its chunk preloaded on idle. The background is served as committed (`provider="none"`: any re-encode of the lossy 2560 master is softer or larger, feature 021) at `fetchpriority="low"`. Barlow 400 is preloaded; Condensed waits for `@nuxt/fonts`' per-weight `preload`. The first pair's portraits get `fetchpriority="high"`; Nuxt Icon ships a client bundle. After the split, temporal-polyfill was out of the entry, zod in it through the header's build controls, regle in it only through `@regle/nuxt`'s global plugin: the schemas move to `zod/mini` and the module goes, `useRegle` imported where the one form lives — an exception to the stack's validation rule, carried upstream. The Nuxt UI header's unused overlay imports (11 KB) stay.

**B — share page.** The `render:html` hook feature 027 already runs for `/b/**` injects a `<link rel="preload" as="fetch">` for `/api/v1/shared/{id}`, so the request leaves with the HTML. Keep-warm is deferred to its own measured decision.

**C — interactions.** The special-power bonus is one computed per hero that returns a shared zero identity and reads allocations only when the power is on. ScrollRegion batches reads to one per frame and takes its first measure after the surface's `animationend` (or 300 ms), listened for rather than queried, since `getAnimations()` forces the very layout avoided. Mounting the synergy pair cards a frame late was tried and dropped: A's async chunk already puts that mount in the task after the click.

Rejected: dropping or narrowing 023's hold; probing Firebase's IndexedDB; redirect sign-in; `sizes="100vw"` on the background; replacing the Reka indicator; one long branch.

## Scope

`web/` only: `app.vue`, `pages/index.vue`, `pages/b/[id].vue`, the Firebase plugin and auth store, `nuxt.config.ts` (icon bundle, fonts, image screens), `ScrollRegion`, `useHeroPowerTraining`, the synergy tab, the SEO render hook, and a CI budget script. No API change.

## Consequences

Bar: LCP ≤ 2.5 s on desktop. On mobile it is a no-regression ceiling, `/` ≤ 5.0 s and `/b/{id}` ≤ 5.5 s: each page's production median rounded up to the half second, restated whenever a decision moves that median, because what remains is hydration behind feature 023's hold. INP ≤ 200 ms at 4×. The bar is recorded, never enforced; CI enforces only the budget. Budget: the JavaScript `/` loads before any interaction — the entry module plus every chunk its prerendered HTML module-preloads — ≤ 230 KB brotli (from 200: the last 26 KB are Nuxt UI's own floor), failed by CI after the web build; a build-only placeholder config feeds that build, since the output is measured, never served. A first dialog open on a cold cache now costs one chunk request; a Sign-in click with a cold Firebase chunk awaits the import before the popup, which a blocker may catch — walked on Chromium and WebKit. `/` no longer has an `unknown` auth moment without the marker. Deferred to the Frontier node: keep-warm, a portrait-cropped background, an own header element, `/b/{id}` CLS 0.079, field data.

## Contracts Touched

- `project-summary.md` — ADR Index row.
- Feature 023 (what runs before the reveal), 004 and 006 (session marker, no `unknown` without it), 007 and 026 (early fetch), 013 (first-measure timing), 028 (portrait priority) — each in the commit that changes it.

## Open Questions

## Verification

Per group: Lighthouse 13.5.0 CLI, mobile and desktop, three runs, median, signed out, test share `eab59a6c`, recorded here and in the map; `nuxt analyze` after A against the budget; a DevTools trace per C change; render count in dev before and after the computed fix.

Group A (2026-10-11, local production build behind a brotli proxy — the project's ignored build step cancels every preview deploy, so production numbers follow the merge): budget 226.0 KB from 315 (CI green). Mobile `/`: LCP 5.39 s (baseline 5.6), FCP 3.0 (3.7), TBT 788 ms (1292), CLS 0.051; `/b/{id}`: LCP 4.71 s (5.5), TBT 304 ms (850). Desktop `/` LCP 1.22 s, `/b/{id}` 1.08 s. The bar is not met on mobile: the LCP element is the first portrait, held by feature 023 until hydration, which is a 793 ms long task after 1.7 s of script evaluation at 4× CPU — a CPU floor, not bytes.

Production after A (master 5f4a304): mobile `/` LCP 4.51 s, TBT 6 ms (6.73 s, 1403 ms the same morning); `/b/{id}` 4.95 s. Group B (same local harness, API forwarded to production): one shared request per load, started at 23 ms instead of 225 ms, the first portrait at 560 ms instead of 786; lab LCP flat at 5.5 s, since a warm API was never the simulated critical path — the gain is the overlap, largest on a cold API.

Group C (local build, mobile emulation, 4× CPU, one trace each): a level-up re-renders 1 card of 4 mounted, from 4 (test `hero-card-render-scope`); dialog open's long task 635 → 564 ms, the forced layout during the enter now Reka's presence read, not ScrollRegion's; synergy tab click INP 129 → 143 ms with the late mount, so it was dropped.

Production with all three groups (master 849161a, 2026-10-11): mobile `/` LCP 4.57 s, TBT 0 ms, CLS 0.051; `/b/{id}` LCP 5.04 s, TBT 148 ms, with the fetch preload live; desktop 0.98 s and 1.17 s. Against the same-day pre-merge production run: `/` 6.73 → 4.57 s and 1403 → 0 ms blocking; `/b/{id}` 7.38 → 5.04 s. Both mobile medians sit under their ceilings, and both pages pass 2.5 s on desktop.
