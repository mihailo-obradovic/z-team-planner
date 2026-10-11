# Decision: Pass Core Web Vitals on a phone — first load, share page, interactions

## Status

Accepted

## Type

performance

## Task Weight

Hard

## Context

The 2026-10-06 baseline (Workflowy, Performance map 055d42c1) measured production against the Core Web Vitals good thresholds, mobile throttled, signed out. Desktop passes everywhere. Mobile fails LCP on `/` (5.6 s) and `/b/{id}` (5.5 s), and three interactions fail INP at 4× CPU: dialog open 970 ms, synergy tab 581 ms, level-up ≈250 ms.

The causes differ. On `/`, feature 023 holds the first paint until `loadInitialBuild` resolves, and that waits on one 315 KB brotli entry chunk carrying every surface: dialogs, drawers, mission panels, forms, Firebase. Nothing is lazy. On `/b/{id}` the chain is serial: HTML, entry, then the API request, then the LCP portrait; the API cold start is 5.7 s, ~4.3 s of it Python function boot. The interactions are app-shaped: one global special-power computed re-renders every card on a Flambae, Coupé or Golem point; ScrollRegion measures on mount mid-layout; the synergy panel mounts under Reka's indicator read.

## Decision

Keep every shipped guarantee and move the cost. Three groups, each on its own branch, merged after its own Lighthouse pass; this record flips to `Implemented` after the third.

**A — first load on `/`.** Every user-opened surface becomes a lazy chunk behind a `v-if` on its open or active state; header, overview cards and tab bar stay in entry. Lazy chunks preload on idle after the reveal and on hover or focus of their trigger. Firebase leaves the anonymous path: a `z-team-session` localStorage marker is written at `signed-in` and removed at `anonymous`; without it the store resolves `anonymous` at boot and the SDK is imported only on a stored session or a Sign-in click, its chunk preloaded on idle. The background is served as committed (`provider="none"`: the 2560×1161 lossy master is already upscaled on phones under `object-cover`, narrower is blurrier, and a re-encode is softer at q70 or a third larger at q90) and gains `fetchpriority="low"`. Barlow 400 is preloaded; the title's and labels' Barlow Condensed weights wait for `@nuxt/fonts`' per-weight `preload` object, which 0.14 lacks. The first pair's portraits get `fetchpriority="high"`; Nuxt Icon ships a client bundle. zod, regle and temporal-polyfill are re-analyzed after the split; zod/mini only if zod stays in entry.

**B — share page.** The `render:html` hook feature 027 already runs for `/b/**` injects a `<link rel="preload" as="fetch">` for `/api/v1/shared/{id}`, so the request leaves with the HTML. Keep-warm is deferred to its own measured decision.

**C — interactions.** The special-power bonus computed returns one shared zero identity and reads allocations only when the power is on. ScrollRegion defers its first measure past the dialog's enter transition and batches reads. Synergy pair cards mount one frame after the tab activates. Each change is traced on its own.

Rejected: dropping or narrowing 023's hold; probing Firebase's IndexedDB; redirect sign-in; `sizes="100vw"` on the background; replacing the Reka indicator; one long branch.

## Scope

`web/` only: `app.vue`, `pages/index.vue`, `pages/b/[id].vue`, the Firebase plugin and auth store, `nuxt.config.ts` (icon bundle, fonts, image screens), `ScrollRegion`, `useHeroPowerTraining`, the synergy tab, the SEO render hook, and a CI budget script. No API change.

## Consequences

Bar: mobile LCP ≤ 2.5 s on both pages, INP ≤ 200 ms at 4×. Budget: the JavaScript `/` loads before any interaction — the entry module plus every chunk its prerendered HTML module-preloads — ≤ 200 KB brotli, failed by CI after the web build; a build-only placeholder config feeds that build, since the output is measured, never served. A first dialog open on a cold cache now costs one chunk request; a Sign-in click with a cold Firebase chunk awaits the import before the popup, which a blocker may catch — walked on Chromium and WebKit. `/` no longer has an `unknown` auth moment without the marker. Deferred to the Frontier node: keep-warm, a portrait-cropped background, zod/mini, `/b/{id}` CLS 0.079, field data.

## Contracts Touched

- `project-summary.md` — ADR Index row.
- Feature 023 (what runs before the reveal), 004 and 006 (session marker, no `unknown` without it), 007 and 026 (early fetch), 013 (first-measure timing), 028 (portrait priority) — each in the commit that changes it.

## Open Questions

## Verification

Per group: Lighthouse 13.5.0 CLI, mobile and desktop, three runs, median, signed out, test share `eab59a6c`, recorded here and in the map; `nuxt analyze` after A against the budget; a DevTools trace per C change; render count in dev before and after the computed fix.
