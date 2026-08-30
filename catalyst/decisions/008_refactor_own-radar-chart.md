# Decision: Draw the stat radar ourselves and drop vue-data-ui

## Status

Accepted

## Type

refactor

## Task Weight

Medium

## Context

The hero detail dialog's five-axis stat radar is drawn by `vue-data-ui`. The dialog's redesign asks the chart for three things, and the installed version (3.15.2) can supply none of them — established by reading the shipped bundle, not the docs:

- **Axis orientation.** The polygon builder is called with a literal `rotation: 0`, so axis 0 sits due east. The helper underneath accepts a rotation and other charts in the same library pass one, but the radar never exposes it. Today this is worked around with `transform: rotate(-90deg)` on the SVG plus a counter-rotation on every `<text>` — the one `:deep()` the design annex sanctions.
- **Labels.** The entire label API is `show`, `fontSize` and `color`. There is no formatter, no per-label override, and the component exposes no label or axis slot, so an icon cannot precede a label.
- **Animation on change.** `points` is bound straight to a computed, so a stat change repaints in one frame with no tween. There is no interpolation anywhere in the component. `useCssAnimation: true` in the current dialog is dead config: it gates only legend show/hide animations, and the legend is off.

The dependency is also unrecorded — `vue-data-ui` appears in no stack module and in no Approved Dependencies row; its only mention in `catalyst/` is the annex's `:deep()` note.

## Decision

Replace it with a small in-house SFC that draws the radar as plain SVG, and remove the dependency.

Geometry is one expression — vertices at `start + i * step` with `start = -Math.PI / 2` — which puts Combat at the apex directly, making the rotation hack unnecessary rather than merely tolerable. Labels sit outside each vertex with `text-anchor` derived from the axis unit vector, so they read horizontally with no transform, and an icon is a sibling `<g transform>`. Grid rings are `[2,4,6,8,10]` mapped to polygons, so "a gridline every 2" is the literal array.

Stat changes tween over the five **values**, not the coordinates, through a `requestAnimationFrame` loop in a composable; the existing geometry computed derives the polygon and the plot dots from the tweened values, so both move together for free. `prefers-reduced-motion: reduce` snaps instead. No new dependency: this is what `@vueuse/core`'s `useTransition` does internally, and that package was deliberately declined by feature 006.

Rejected: keeping the library and drawing labels through its `svg` slot. That leaves the rotation and the missing tween unsolved while still paying for the library, and hand-drawing labels is most of the work anyway.

## Scope

- New: the radar SFC and its tween composable under `web/`.
- Changed: `web/components/HeroDetailDialog.vue` — swaps chart component, drops its `radarColors` `getComputedStyle` scraping (the SVG can read `var(--ui-primary)` directly) and its `:deep()` style block.
- Removed: the `vue-data-ui` dependency and its global stylesheet entry in `nuxt.config.ts`.
- Behaviour contracts are untouched: the radar shows the same five effective stats, and feature 003's rules on displayed level, effective stat and silent no-ops are unaffected. Axis orientation and gridline interval are presentation, not contract.

## Consequences

- The three redesign requirements become possible, and the dialog redesign can proceed on top of a chart that already behaves.
- First paint loses ~18 kB gzip: `vue-data-ui/style.css` sits in `nuxt.config.ts`'s global `css` array, so the whole library's stylesheet loads on every page even though the chart is async and client-only. The async chunk sheds ~90 kB gzip, mostly machinery this project disables.
- The one sanctioned `:deep()` in the design system goes away.
- We own the chart now: no upstream fixes, and the Synergy Pairs and Mission Simulator tabs that also want a radar become our maintenance. That is the point — they would have hit the same three walls.
- Accessibility changes shape: the library offered a hidden data table, the replacement carries `role="img"` with `<title>`/`<desc>`. The stat rows beside the chart already carry every number as text, so a table would duplicate them.
- The dependency's absence from Approved Dependencies is closed by deletion rather than by a new row.

## Contracts Touched

- `architecture.md` — the `vue-data-ui` removal; no Approved Dependencies row is added, because none existed.
- `annexes/design-system.md` — the `:deep()` note that named this chart as the sanctioned exception.
- `web/CLAUDE.md` — the `utils/` and `components/` orientation lines.
- `catalyst/features/003_planner-mechanics.md` — unchanged; its contract-bearing values are untouched.

## Open Questions

## Verification
