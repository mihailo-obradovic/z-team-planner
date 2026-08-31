# Feature: Mission simulator responsive layout

## Status

Approved

## Task Weight

Medium

## Purpose

Feature 015 designed the mission simulator at desktop width and named the responsive layout a non-goal. This is that non-goal: the ladder the tab reflows through, from the desktop design down to a 320px viewport, with no horizontal scrolling and nothing wider than the screen at any width.

## Inputs

| Input | Type | Source | Constraints |
| --- | --- | --- | --- |
| tab content width | layout | `@container` on the mission tab wrapper | the wrapper's **content** box — its `p-4` is outside the queried width, so every threshold sits 32px below the viewport width it corresponds to |
| condition-column view | UI event | the templates panel's `REQ` / `CONDITIONS` toggle | rendered below 28.5rem only |

## Outputs And Side Effects

| Output / Side Effect | Type | Description |
| --- | --- | --- |
| tier layout | rendered | panel order, row composition and column counts per threshold |
| slot anatomy | rendered | the team slot's classic form, or the overlay form below 35rem |
| condition-column view | component `ref` | which column set the narrow templates panel shows; never serialized |

## Scope And Non-Goals

In scope:

- The four thresholds and what each changes, across all five mission components.
- The team slot's second anatomy and the templates panel's condition-column toggle.

Non-goals:

- Any change to the success model, the slot mechanics, the serialized keys, or the desktop layout above 78rem — all of that is feature 015 and none of it moves.
- The other two tabs; the app shell, header and mobile action bar (design-system annex §14.3 already covers them).
- Animating tier changes.
- The hero picker dialog, which measures ~57px portraits at 320 and is left alone.

## User / System Behavior

Container queries on the tab's own wrapper drive everything — not viewport breakpoints — so the rules survive any future page chrome. Four thresholds, each a subtraction from feature 015's layout, which is the widest tier and is reached unchanged.

**78rem (≈1280px viewport) — the top row splits.** Templates and the requirements check take the first row, the team the second, the math the third. All three rows fill the tab, capped at the width feature 015's three panels occupy above the threshold so nothing jumps across it. The math panel itself splits into two columns: the per-stat rows left, the success calculation and the special conditions right.

**49rem (≈816px) — one column.** Every panel takes a full row, in the order templates, requirements, team, math. The math panel reverts to a single column.

**35rem (≈592px) — the team panel alone,** because its four slots stop fitting before any other panel breaks. The slots turn fluid under their existing width, then flip anatomy: the control row leaves the top of the card and its three controls overlay the portrait — remove top-right, the two move arrows in the bottom corners, the slot index top-left — always visible on a scrim, since this is the tier with no hover. The hero name drops to the portrait's accessible name, the empty slot keeps only its plus glyph, and the copy and illusion markers become badges on the portrait.

**28.5rem (≈488px) — the templates and requirements panels.** Templates drops its stat wordmarks to icons and shows one condition column set at a time behind a `REQ` / `CONDITIONS` toggle. The requirements panel's radar frame turns fluid under its existing cap, and its legend keeps two columns on a tighter gap.

Tier changes are not animated. Feature 015's height, radar and value animations are unaffected by them.

## Roles And Access

Not role-specific.

## Examples

| Input | Expected Output | Notes |
| --- | --- | --- |
| 1280px viewport | feature 015's layout, untouched | three auto tracks, the team at its own width, centred |
| 1279px viewport | templates + requirements row, team row, math row split in two | the first subtraction |
| 816 → 815px viewport | two columns become one | the 49rem crossing |
| 600px viewport | single column; team slots narrowed but still four across | fluid slots, classic anatomy |
| 480px viewport | templates on icons behind the toggle; radar frame fluid | the narrowest tier |
| 320px viewport | no horizontal scrolling, nothing wider than the viewport | the reflow floor |
| toggle set to `CONDITIONS`, then the tab widens past 28.5rem | both column sets shown, no toggle | its position is kept for a return |

## Business Rules

- The condition-column toggle is view state, never build state: it lives in the component, never in planner state, and so cannot reach a serialized document, a share link, or dirty tracking. This preserves feature 015's invariant that layout choices never enter the build document.
- Above 28.5rem the toggle is not rendered at all — nothing is hidden at that width.
- Disabled slot controls keep rendering in the overlay anatomy, dimmed rather than absent.
- Every control keeps the 24 × 24 touch-target floor (design-system annex §14.2) at every tier; no tier removes a capability.

## Edge Cases

- The team's threshold (35rem) deliberately does not coincide with the others' (28.5rem). Four slots carrying the classic control row need a 552px viewport at best — its three controls are already on the touch floor — so a shared 28.5rem threshold would leave a band where the four slots wrap out of their single row.
- Below 35rem the overlay controls sit on a ~52px portrait: on the touch floor, not above it, the same trade the hero card already makes.
- The templates panel is the widest panel (454px measured), so it is the one that forces the 28.5rem tier; the others reach it with room to spare.

## Invariants

- At every width from 1280 down to 320, `scrollWidth === clientWidth` on the tab container and no element is wider than the viewport.
- Above 78rem the rendered layout is byte-for-byte feature 015's: no rule in this feature applies there.
- No tier removes an action. Every control reachable at 1280 is reachable at 320.

## Error Handling

Not applicable — layout only, no failure modes of its own.

## Entry Points

- `web/pages/index.vue`: the `@container` wrapper, the grid, and the ladder's two upper thresholds.
- `web/components/mission/MissionMathPanel.vue`: the two-column split.
- `web/components/mission/MissionTeamPanel.vue`: fluid slots and the overlay anatomy.
- `web/components/mission/MissionTemplatesPanel.vue`: icon labels and the condition-column toggle.
- `web/components/mission/MissionRequirementsPanel.vue`: the fluid radar frame and the legend gap.
- `catalyst/annexes/design-system.md` §14.3 (the ladder and its measurements) and §14.2 (the overlay controls' touch-target trade).

## Dependencies

- Feature 015, whose layout is this feature's widest tier and whose panels it reflows.
- Feature 014's `SynergyPairCard`, the precedent for container queries over viewport breakpoints in this app.
- Design-system annex §14.2 (touch targets) and §14.3 (breakpoints and reflow).

## Open Questions

_None — resolved in the grilling session of 2026-08-31._

## Tests

- No unit tests: this feature changes no model, no state and no serialized value.
- Measured browser walk at 1280 / 1279 / 1032 / 816 / 815 / 600 / 490 / 320: `scrollWidth === clientWidth` on the tab container, no element wider than the viewport, and the panel widths and row order each tier specifies.

## Verification

_Empty while draft._

## Agent Change Rules

Before changing this feature, an agent must:

1. Read this feature document and feature 015.
2. Identify which threshold or invariant is affected.
3. Confirm the Status is `Approved` (or later), or ask the user to approve the document first.
4. Re-run the measured walk for the thresholds touched.
5. Update this document and the design-system annex in the same change if the intended behavior changes.
6. Update `project-summary.md` if the feature summary or status changes.
