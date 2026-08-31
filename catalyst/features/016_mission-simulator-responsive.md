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
| tab content width | layout | `@container` on the mission tab wrapper | the wrapper's **content** box: its `p-4` is outside the queried width, and the layout's scrolling main takes a further 10px for its scrollbar when it overflows, so a threshold fires 32–42px below the viewport width it names |
| condition-column view | UI event | the templates panel's `Requirements` / `Conditions` toggle | rendered below 28.5rem only |

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

Container queries on the tab's own wrapper drive everything — not viewport breakpoints — so the rules survive any future page chrome. Four thresholds, each a subtraction from feature 015's layout, which is the widest tier and is reached unchanged. The thresholds are container widths, and the viewport figures below are approximations: the offset between them is not fixed, because the scrolling main's scrollbar appears and disappears with content height.

**77rem — the top row splits.** Templates and the requirements check take the first row, the team the second, the math the third. All three rows fill the tab, capped at the width feature 015's three panels occupy above the threshold so nothing jumps across it. The math panel itself splits into two columns: the per-stat rows left, the success calculation and the special conditions right. That split has its own lower bound rather than ending with this tier — see below.

The threshold is 77rem rather than the 78rem a 1280px viewport suggests, and the difference is the point: at that viewport the queried box measures 1238 or 1248 depending on the scrollbar, so 78rem would put the widest tier's own width inside the split tier. 77rem clears both.

The first row's tracks are `minmax(454px, 1fr) 1fr`, not two equal `1fr`. Equal tracks read correctly while there is room and are what the row uses above ~876, but below that half the container stops holding the templates panel's four columns and its `Fail ≥` column leaves the card — invisibly, since it stays inside the tab. The floor is the templates panel's own width; the requirements check gives up width first, down to the 316 it needs.

**49.5rem (≈834px viewport) — one column.** Every panel takes a full row, in the order templates, requirements, team, math. The threshold is where the first row's two tracks and their gap (454 + 316 + 16 = 786) stop fitting, not a round number.

The math panel does **not** revert here. Below 77rem it spans the whole tab whether the tab is one column or three, so its two columns keep working after the rest of the layout stacks. Its own lower bound is **a 768px viewport**, written as a 726px container because the queried box runs 42px under the viewport once the scrolling main has its scrollbar. Two columns measurably hold much further — down to a 510px panel — so the bound is a judgement about where the split still reads well, not where it breaks.

**35rem (≈602px viewport) — the team panel alone,** because its four slots stop fitting before any other panel breaks. The slots turn fluid under their existing width, then flip anatomy: the control row leaves the top of the card and its three controls overlay the portrait — remove top-right, the two move arrows in the bottom corners, the slot index top-left — always visible on a scrim, since this is the tier with no hover. The hero name drops to the portrait's accessible name, the empty slot keeps only its plus glyph, and the copy and illusion markers become badges on the portrait.

**28.5rem (≈498px viewport) — the templates panel.** It shows one condition column set at a time behind a `Requirements` / `Conditions` toggle. Showing one set is what buys the room, so the stat wordmarks stay: they survive the whole tier and go only at **19rem**, where the Conditions view's two steppers stop fitting beside them and the icon carries the stat alone. The Requirements view never needs that — its labels fit at every width measured. The requirements panel is likewise untouched at this threshold: its legend measures 221px in two columns and still fits. Its radar frame instead carries `max-w-full` at every width — the frame is the panel's design width exactly, so it is the first thing to run out of room, and it gives up width rather than bleed over the panel's padding. That happens below ~348px, not at a threshold.

Tier changes are not animated. Feature 015's height, radar and value animations are unaffected by them.

## Roles And Access

Not role-specific.

## Examples

| Input | Expected Output | Notes |
| --- | --- | --- |
| 1280px viewport | feature 015's layout, untouched | 454 / 316 / 388 tracks, the team 568 and centred |
| 1000px viewport | templates + requirements 471 each, team and math 958 | the math panel in two columns |
| 900px container | templates floored at 454, requirements 430 | equal tracks give way to the floor |
| 819px viewport | one column, every panel 777 | past the 49.5rem crossing |
| 600px viewport | one column; team slots 128 square, controls on the portrait | past the 35rem crossing |
| 490px viewport | templates behind the toggle, wordmarks intact; team slots 101 | the narrowest tier |
| 768px viewport | the math panel in two columns, 333 each | its bound is its own, not the layout's |
| 767px viewport | the math panel back to one column | the chosen stop, not the measured limit |
| 320px viewport | four team slots 59 square in one row; radar frame 250; stat icons only | the reflow floor |
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
- The templates panel is the widest panel (454px measured) and the only one with a hard floor in the two-column row; it is also what forces the 28.5rem tier, where its four columns still fit at 488 with the stat column at 100 and flip at 487.
- The panel has no honest `min-content` — its inner grid overflows rather than pushing back — so `minmax(min-content, 1fr)` does not protect it and the floor has to be the measured width.
- The requirements panel's legend and outcome band (221px and 250px) fit inside 320px unaided, so the 28.5rem threshold changes nothing there.

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
- `web/components/mission/MissionRequirementsPanel.vue`: the radar frame's `max-w-full`.
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

Measured in the browser on 2026-08-31, dev server, Chromium.

**Real viewports, all six from the walk.** At 1280 / 1000 / 819 / 600 / 490 / 320: `scrollWidth === clientWidth` on both the tab container and the document, no element in the page wider than the viewport, and no element inside any panel past that panel's border box. Layout per tier: 1280 → two rows, 454 / 316 / 388 with the team 568 and centred (feature 015 untouched); 1000 → three rows, 471 / 471 with the math in two 449px columns; 819 → four rows at 777; 600 → four rows at 558, slots 128 square with the overlay controls; 490 → slots 101, the templates toggle shown; 320 → slots 59 square in **one** row, radar frame 250 under its 288 cap.

**Container sweep, 483 widths × both toggle views.** Every queried width from 1240 down to 276 in 2px steps, in the Requirements view and the Conditions view: no panel overflow and no grid wider than its container at any of them. Checked at the boundaries: the math panel is two columns at a 726 container and one at 725; the templates wordmarks are present at 304 and gone at 303.

The observed viewport-to-container offset was 32px without the scrolling main's scrollbar and 42px with it, which is why 77rem carries margin over the 78rem that 1280 nominally maps to.

## Agent Change Rules

Before changing this feature, an agent must:

1. Read this feature document and feature 015.
2. Identify which threshold or invariant is affected.
3. Confirm the Status is `Approved` (or later), or ask the user to approve the document first.
4. Re-run the measured walk for the thresholds touched.
5. Update this document and the design-system annex in the same change if the intended behavior changes.
6. Update `project-summary.md` if the feature summary or status changes.
