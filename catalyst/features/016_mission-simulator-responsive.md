# Feature: Mission simulator responsive layout

## Status

Active

## Task Weight

Medium

## Purpose

Feature 015 designed the mission simulator at desktop width and named the responsive layout a non-goal. This is that non-goal: the ladder the tab reflows through, from the desktop design down to a 320px viewport, with no horizontal scrolling and nothing wider than the screen at any width.

## Inputs

| Input | Type | Source | Constraints |
| --- | --- | --- | --- |
| tab content width | layout | `@container` on the mission tab wrapper | the wrapper's **content** box: `p-4` is outside it and the scrolling main takes 10px more when its scrollbar is up, so a threshold fires 32–42px below the viewport width it names |
| condition-column view | UI event | the templates panel's `Requirements` / `Conditions` toggle | rendered below 28.5rem only |

## Outputs And Side Effects

| Output / Side Effect | Type | Description |
| --- | --- | --- |
| tier layout | rendered | panel order, row composition and column counts per threshold |
| slot anatomy | rendered | the team slot's classic form, or the overlay form below 35rem |
| condition-column view | component `ref` | which column set the narrow templates panel shows; never serialized |

## Scope And Non-Goals

In scope:

- The thresholds and what each changes, across all five mission components.
- The team slot's second anatomy and the templates panel's condition-column toggle.

Non-goals:

- Any change to the success model, the slot mechanics, the serialized keys, or the desktop layout above 77rem — all of that is feature 015 and none of it moves.
- The other two tabs; the app shell, header and mobile action bar (annex §14.3 covers them).
- Animating tier changes.
- The hero picker dialog, which measures ~57px portraits at 320 and is left alone.

## User / System Behavior

Container queries on the tab's own wrapper drive everything — not viewport breakpoints — so the rules survive any future page chrome. Each threshold is a subtraction from feature 015's layout, which is the widest tier and is reached unchanged. Thresholds are container widths; the viewport figures are approximations, because the scrolling main's scrollbar comes and goes with content height. The measurements behind each number are in annex §14.3.

**77rem — the top row splits.** Templates and the requirements check take the first row, the team the second, the math the third. All three fill the tab, capped at the width feature 015's three panels occupy above the threshold so nothing jumps across it. The math panel splits into two columns: the per-stat rows left, the success calculation and the special conditions right.

77rem rather than the 78 a 1280px viewport suggests: there the queried box is 1238 or 1248 depending on the scrollbar, and 78rem would put the widest tier's own width inside the split tier.

The first row's tracks are `minmax(454px, 1fr) 1fr`, not two equal `1fr`: below a ~876 container half of it stops holding the templates panel's four columns. Equal while there is room, floored at the templates panel's width when there is not, with the requirements check giving up width first down to the 316 it needs.

**49.5rem (≈834px viewport) — one column.** Every panel takes a full row, in the order templates, requirements, team, math. The threshold is where the first row's two tracks and their gap (454 + 316 + 16 = 786) stop fitting, not a round number.

The math panel does **not** revert here: below 77rem it spans the whole tab whether the tab is one column or three, so its split outlives the layout's. Its own bound is **a 768px viewport** (a 726px container) — a judgement about where the split still reads well, since two columns measurably hold to a 510px panel.

**35rem (≈602px viewport) — the team panel alone,** because its four slots stop fitting before any other panel breaks. The slots turn fluid under their existing width, then flip anatomy: the control row leaves the top of the card and its three controls overlay the portrait — remove top-right, the two move arrows in the bottom corners, the slot index top-left — each on its own scrim, since this is the tier with no hover. The hero name drops to the portrait's accessible name, the empty slot keeps only its plus glyph, and the copy and illusion markers become badges on the portrait.

**28.5rem (≈498px viewport) — the templates panel.** It shows one condition column set at a time behind a `Requirements` / `Conditions` toggle. The row goes **compact** rather than dropping its wordmarks: the label steps down a type size and its icon with it, the stepper tightens its gaps and narrows its value slot, and the column gap halves. The **+/- buttons do not shrink** — they are on the 24 × 24 touch floor (annex §14.2), so the space comes from everything around them. Stat names stay on screen at every width worth designing for, an iPhone SE included.

Only the Conditions view runs out of room even so, and only below **20rem** — past every width worth designing for, but short of the 320px reflow floor, where the icon carries the stat alone. The Requirements view never reaches it: one stepper leaves a label room at every width measured. Each stat row is `1fr` for the icon-and-wordmark cell and `auto` for the rest, so the label sits left and the steppers group right, as at the widest tier.

The requirements panel is untouched here — its legend fits at 320 unaided. Its radar frame instead carries `max-w-full` at every width: the frame is the panel's design width exactly, so it is the first thing to run out of room and gives up width rather than bleed over the panel's padding, below ~348px rather than at a threshold.

Tier changes are not animated. Feature 015's height, radar and value animations are unaffected.

## Roles And Access

Not role-specific.

## Examples

| Input | Expected Output | Notes |
| --- | --- | --- |
| 1280px viewport | feature 015's layout, untouched | 454 / 316 / 388 tracks, the team 568 and centred |
| 1000px viewport | templates + requirements 471 each, team and math 958 | the math panel in two columns |
| 900px container | templates floored at 454, requirements 430 | equal tracks give way to the floor |
| 819px viewport | one column, every panel 777 | past the 49.5rem crossing |
| 768 → 767px viewport | the math panel two columns, then one | its bound is its own, not the layout's |
| 600px viewport | team slots 128 square, controls on the portrait | past the 35rem crossing |
| 490px viewport | the toggle shown, wordmarks intact; team slots 101 | the narrowest tier |
| 375px viewport, Conditions view | full stat names, compact row, buttons still 24 | an iPhone SE reads normally |
| 320px viewport | four team slots 59 square in one row; radar frame 250; Conditions on icons; no horizontal scrolling | the reflow floor |
| toggle on `Conditions`, then the tab widens past 28.5rem | both column sets shown, no toggle | its position is kept for a return |

## Business Rules

- The condition-column toggle is view state, never build state: it lives in the component, never in planner state, and so cannot reach a serialized document, a share link, or dirty tracking. This preserves feature 015's invariant that layout choices never enter the build document.
- Above 28.5rem the toggle is not rendered at all — nothing is hidden at that width.
- Disabled slot controls keep rendering in the overlay anatomy, dimmed rather than absent.
- Every control keeps the 24 × 24 touch-target floor (annex §14.2) at every tier. Where a row gives up width, the floor fixes which parts give: gaps, value slots and type sizes, never the controls.

## Edge Cases

- The team's threshold (35rem) deliberately does not coincide with the templates panel's (28.5rem): four slots carrying the classic control row need a 552px viewport at best, so a shared one would leave a band where they wrap out of their single row. Each panel changes where its own constraint bites.
- Below 35rem the overlay controls sit on a ~52px portrait: on the touch floor, not above it, the same trade the hero card makes.
- The templates panel (454px) is the widest and the only one with a hard floor in the two-column row. It has no honest `min-content` — its inner grid overflows rather than pushing back — so the floor must be that measured width.

## Invariants

- At every width from 1280 down to 320, `scrollWidth === clientWidth` on the tab container and no element is wider than the viewport.
- Above 77rem the rendered layout is byte-for-byte feature 015's: no rule in this feature applies there.
- No tier removes an action. Every control reachable at 1280 is reachable at 320.

## Error Handling

Not applicable — layout only, no failure modes of its own.

## Entry Points

- `web/pages/index.vue`: the `@container` wrapper, the grid, and the two upper thresholds.
- `web/components/mission/MissionMathPanel.vue`: the two-column split and its own bound.
- `web/components/mission/MissionTeamPanel.vue`: fluid slots and the overlay anatomy.
- `web/components/mission/MissionTemplatesPanel.vue`: the toggle, the compact row, the wordmark.
- `web/components/mission/MissionValueStepper.vue`: the compact stepper.
- `web/components/mission/MissionRequirementsPanel.vue`: the radar frame's `max-w-full`.
- `catalyst/annexes/design-system.md` §14.3 (the ladder and its measurements) and §14.2 (touch targets).

## Dependencies

- Feature 015, whose layout is this feature's widest tier and whose panels it reflows.
- Feature 014's `SynergyPairCard`, the precedent for container queries over viewport breakpoints here.
- Design-system annex §14.2 and §14.3.

## Open Questions

_None — resolved in the grilling session of 2026-08-31._

## Tests

- No unit tests: this feature changes no model, no state and no serialized value.
- A measured browser walk is the verification, at the widths named below.

## Verification

Measured 2026-08-31, dev server, Chromium.

**Six real viewports** — 1280 / 1000 / 819 / 600 / 490 / 320: `scrollWidth === clientWidth` on the tab container and the document, nothing wider than the viewport, nothing inside a panel past that panel's border box, and layout per tier as the Examples state.

**Container sweep, 483 widths × both toggle views** — 1240 down to 276 in 2px steps: no panel overflow, no grid wider than its container, no label cell squeezed under its own text, no control under 24 × 24. Boundaries: the math two columns at a 726 container and one at 725; the Conditions wordmarks present at 320, gone at 318.

Both probes are needed — one against the viewport misses a panel clipping its own content, one against the border box misses a `1fr` cell crushing its text. The offset ran 32px without the scrolling main's scrollbar and 42 with it, which is why 77rem carries margin.

## Agent Change Rules

Before changing this feature, an agent must:

1. Read this feature document and feature 015.
2. Identify which threshold or invariant is affected.
3. Confirm the Status is `Approved` (or later), or ask the user to approve the document first.
4. Re-run the measured walk for the thresholds touched, with both probes.
5. Update this document and the design-system annex in the same change if the intended behavior changes.
6. Update `project-summary.md` if the feature summary or status changes.
