# Decision: Draw the stat radar ourselves and drop vue-data-ui

## Status

Implemented

## Type

refactor

## Task Weight

Medium

## Context

The hero detail dialog's five-axis stat radar was drawn by `vue-data-ui`. The dialog's redesign asked the chart for three things, and the installed version (3.15.2) could supply none of them — established by reading the shipped bundle, not the docs:

- **Axis orientation.** The polygon builder is called with a literal `rotation: 0`, so axis 0 sits due east. The helper underneath accepts a rotation and sibling charts pass one, but the radar never exposes it. The workaround was `rotate(-90deg)` on the SVG plus a counter-rotation on every `<text>` — the one `:deep()` the annex sanctioned.
- **Labels.** The entire label API is `show`, `fontSize` and `color` — no formatter, no per-label override, no label or axis slot, so an icon cannot join a label.
- **Animation on change.** `points` binds straight to a computed, so a stat change repaints in one frame; there is no interpolation in the component at all.

The dependency was also unrecorded — `vue-data-ui` appeared in no stack module and in no Approved Dependencies row.

## Decision

Replace it with a small in-house SFC that draws the radar as plain SVG, and remove the dependency.

Geometry is one expression — vertices at `start + i * step` with `start = -Math.PI / 2` — which puts Combat at the apex directly, making the rotation hack unnecessary rather than merely tolerable. Each axis is marked by an icon in an ink disc placed off its vertex, upright, with nothing rotated. Grid rings are `[2,4,6,8,10]` mapped to polygons, so "a gridline every 2" is the literal array.

Stat changes tween over the five **values**, not the coordinates, through a `requestAnimationFrame` loop in a composable; the geometry computed derives polygon and dots from the tweened values, so both move together for free. `prefers-reduced-motion: reduce` snaps instead. No new dependency — this is what the declined `@vueuse/core` does internally.

Rejected: keeping the library and drawing labels through its `svg` slot. That leaves the rotation and the missing tween unsolved while still paying for the library, and hand-drawing labels is most of the work anyway.

## Scope

- New: the radar SFC and its tween composable under `web/`.
- Changed: `HeroDetailDialog.vue` — swaps the chart, drops its `getComputedStyle` colour scraping (the SVG reads `var(--ui-primary)` directly) and its `:deep()` block.
- Removed: `vue-data-ui` and its global stylesheet entry in `nuxt.config.ts`.
- Behaviour contracts are untouched: the radar shows the same five effective stats, and feature 003's rules on displayed level, effective stat and silent no-ops are unaffected. Axis orientation and gridline interval are presentation, not contract.

## Consequences

- First paint loses ~18 kB gzip: the library's whole stylesheet sat in the global `css` array, loading on every page even though the chart is async and client-only. The async chunk sheds ~90 kB gzip.
- The one sanctioned `:deep()` in the design system goes away.
- We own the chart now: no upstream fixes, and every other radar in the app (synergy pairs, the mission simulator) is our maintenance. That is the point — they would have hit the same walls.
- Accessibility changes shape: the library offered a hidden data table, the replacement carries `role="img"` with `<title>`/`<desc>`. The stat rows already carry every number as text, so a table would duplicate them.
- The dependency's absence from Approved Dependencies is closed by deletion rather than by a new row.

## Contracts Touched

- `architecture.md` — **unchanged**, and deliberately: `vue-data-ui` was never an Approved Dependencies row, so removing it adds and removes nothing there.
- `annexes/design-system.md` — the `:deep()` note that named this chart as the sanctioned exception.
- `web/CLAUDE.md` — the `utils/` and `components/` orientation lines.

## Open Questions

## Verification

Measured in a browser: computed `transform` is `none` — the rotation hack and its counter-rotation are gone rather than replaced; Combat sits at the apex with the other four axes level in pairs; five rings, five spokes, five dots, and a `<title>`/`<desc>` naming the hero and every value. Raising Combat produced 32 distinct intermediate polygon states decelerating to rest inside ~200ms — the tween working, not the attribute snapping. `oxfmt`, `oxlint`, `nuxt typecheck` clean; the test suite passes. Not covered: a `prefers-reduced-motion` machine — the snap path is reviewed but was not exercised live.
