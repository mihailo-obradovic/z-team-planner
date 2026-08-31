# Feature: Synergy pairs tab

## Status

Approved

## Task Weight

Medium

## Purpose

Fill the planner's empty "Synergy pairs" tab (a feature 003 placeholder) with the analysis view the overview cannot give: what each derived pair's two heroes add up to. The overview shows pairs only as a badge on a separator; the dialog shows one pair's totals from one hero's side. This tab puts every pair's combined stats and radar shape side by side, so a player can compare pairs at a glance and probe what-ifs by toggling powers in place.

## Inputs

| Input                       | Type     | Source                                    | Constraints                                                        |
| --------------------------- | -------- | ----------------------------------------- | ------------------------------------------------------------------ |
| derived synergy pairs       | state    | episode setup (feature 003)               | 4 base pairs + at most 1 conditional; never user-selected here     |
| power / special toggles     | UI event | the icon row under each portrait          | same shared planner state the overview writes; same gating         |
| sonar form toggle           | UI event | Sonar's icon row                          | shared display state; never serialized (feature 012)               |
| portrait click              | UI event | either portrait in a card                 | opens that hero's detail dialog; the active tab does not change    |

## Outputs And Side Effects

| Output / Side Effect | Type     | Description                                                                  |
| -------------------- | -------- | ---------------------------------------------------------------------------- |
| pair cards           | rendered | one full-width card per derived pair, stacked vertically in the tab's scroll |
| pair total           | rendered | per-stat sum of both heroes' effective stats — read-only, no steppers        |
| combined radar       | rendered | one `StatRadar` series of the pair totals, `max` 10, clipping at the rim     |

No new serialized state. The one durable state-shape change — Sonar's form toggle lifted from card-local to shared — stays out of the build format.

## Scope And Non-Goals

In scope:

- The tab's content: one card per derived pair, with both portraits, their power/status icon rows, the read-only pair total, and the combined radar.
- Extracting the pair-total computation the dialog already does into a shared home, so the dialog and the tab can never disagree.
- Lifting Sonar's form toggle to shared state (amends feature 012's "Sonar's form" row; it remains never serialized).

Non-goals:

- Synergy *levels* (0–3, +5%/level) — unmodeled, reserved for the mission simulator.
- A small-screen layout: the tab targets full-width cards; its 320px reflow is deliberately deferred to a follow-up.
- Editing chrome: no stat steppers, no flight, no reset, no level controls — those live on the overview and in the dialog.
- Adding, removing, or toggling pairs — pairs are derived from episode setup only.

## User / System Behavior

- The tab lists one card per pair from the derived set, in the overview's pair order, stacked vertically and scrolling in the tab's existing scroll area.
- Card title: both hero names plus the link-icon `Synergy` badge (the overview separator's badge). No close control, no "active" label — a card appears and disappears only when episode setup changes the derived pairs.
- Card body, side by side across the full width: the two portrait blocks, the pair-total stat list, the radar.
- Each portrait block is a slim analysis view: the portrait and, under it, the overview card's power/special/form toggle row — same shared state, so a toggle made here shows everywhere and vice versa. Flight is not shown.
- The pair total is computed exactly as the dialog's pair-total block: per stat, the sum of both heroes' effective stats, with a slot-filling power re-derived for a two-hero call (feature 012's `min(slots, 2)` rule for Spread Thin). Each hero's effective stat is clamped at `MAX_STAT_VALUE` before summing; the sum itself may exceed 10 and is shown as-is in the list.
- The radar plots the five pair totals as a single series on the shared `StatRadar`, `max` 10 — a total past 10 saturates at the rim while the list beside it shows the true number.
- Clicking a portrait opens that hero's detail dialog through the page's existing selection flow; the synergy tab stays active underneath.

## Roles And Access

Not role-specific.

## Examples

| Input                                                     | Expected Output                                                          | Notes                              |
| --------------------------------------------------------- | ------------------------------------------------------------------------ | ---------------------------------- |
| default episode setup                                     | 4 cards; a 5th appears once the ep3 cut + ep4 hire form a conditional pair | pairs derived, never edited here   |
| change the ep3 cut or ep4 hire                            | the conditional card swaps or disappears; base cards unaffected           |                                    |
| pair combat 8 + 7                                         | list shows 15; radar combat axis sits at the rim (10)                     | clip in the radar only             |
| Coupé at 10 combat with En Pointe +3, partner combat 5    | pair combat shows 15, not 18                                             | per-hero clamp before summing      |
| Golem's card, Spread Thin at 3 slots                      | pair total credits 2 slots — the partner fills one                        | same figure as the dialog's block  |
| toggle a power on a synergy card                          | overview card and dialog reflect it immediately                          | one shared state                   |
| toggle Sonar's form on the overview                       | the Malevola–Sonar card shows the swapped stats                          | form state lifted to shared        |
| click a portrait on a card                                | that hero's detail dialog opens; synergy tab still active on close        |                                    |

## Business Rules

- Pair total per stat = `clamp(effectiveStats(hero1), 10) + clamp(effectiveStats(hero2), 10)`, with slot-filling powers re-derived for the pair (feature 012). One computation serves the dialog and the tab.
- The radar never receives a `max` other than `MAX_STAT_VALUE`; comparability across the five cards depends on every radar sharing the same scale.
- The icon rows reuse the overview's toggle actions and gating verbatim — no synergy-local state, no divergence.
- The cards are read-only about pairs: nothing on this tab can create, remove, or reorder a pair.

## Edge Cases

- A conditional pair whose hero is hidden by episode setup produces no card (mirrors the overview's `visibleHeroes` filter).
- A pair total of 20 (both heroes maxed) renders at the rim, not outside the chart.
- Toggling a power that changes Golem's slot count updates the pair total and radar in the same tick.

## Invariants

- Pairs shown are exactly the derived set from episode setup — this tab holds no pair state of its own.
- The dialog's pair-total block and this tab's pair total always show the same numbers for the same pair.
- Sonar's form state, though shared, is never serialized into the build format (feature 001/012).

## Error Handling

- No error states: an ineligible toggle is a silent no-op with its button disabled, as on the overview.

## Entry Points

- `web/pages/index.vue`: the `#synergy-pairs` tab slot — currently an empty placeholder.
- A new pair card component and a slim portrait-block component under `web/components/`.
- `web/components/_shared/StatRadar.vue`: consumed unchanged, single series, `max` 10.
- `web/composables/useHeroEpisodeSetup.ts`: `synergyPairColumns` — the derived pair source.
- The pair-total computation extracted from `web/components/HeroDetailDialog.vue` into a composable both surfaces call.

## Dependencies

- Feature 003 (planner mechanics): episode setup, derived pairs, toggle gating.
- Feature 012 (special powers): effective-stat math, the pair's `min(slots, 2)` rule, Sonar's form — amended by this feature for the shared form state, and by the preceding per-hero clamp fix.
- Feature 011 (hero detail dialog): the selection flow the portrait click enters; its pair-total block moves onto the shared computation.
- Feature 002 (hero data): `STAT_NAMES`, `MAX_STAT_VALUE`, pair definitions.

## Open Questions

- None.

## Tests

- Pair-total computation: the clamp-before-sum case (10 + En Pointe +3 contributes 10), the Spread Thin `min(slots, 2)` re-derivation matching the dialog, and a sum past 10 passing through unclipped.
- Component: the derived card set for default and conditional setups, shared toggle state round-tripping to the overview, portrait click emitting the existing selection event.

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
