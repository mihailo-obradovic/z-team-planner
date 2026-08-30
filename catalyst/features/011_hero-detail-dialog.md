# Feature: Hero detail dialog

## Status

Draft

## Task Weight

Medium

## Purpose

The planner's cards are deliberately dense — four power chips, a 108px portrait, five stat rows. The detail dialog is where one hero is examined properly: every power with its full description, the stats large enough to read across a room, the hero's shape as a radar, and the synergy pair's combined totals. It edits exactly the same planner state feature 003 owns; nothing here is a second source of truth.

Replaces the dialog feature 003 shipped, which showed powers and stats but had no way to reach another hero, no sight of the synergy partner, and a chart whose axes were in an arbitrary order.

## Inputs

| Input            | Type             | Source                      | Constraints                                                    |
| ---------------- | ---------------- | --------------------------- | -------------------------------------------------------------- |
| open hero        | `HeroId \| null` | a card's portrait           | `null` closes; the dialog renders nothing when closed          |
| roster selection | UI event         | rail (`lg`+) or ribbon      | any hero on the current-setup roster; switches without closing |
| stat allocation  | UI event         | per-stat `−` / `+`          | feature 003's budgets; absent for fixed-level heroes           |
| bonus level      | UI event         | `+` in the stats header     | feature 003's shared pool of 4                                 |
| per-hero reset   | UI event         | reset glyph in that header  | feature 003's reset                                            |
| power / flight   | UI event         | a card in the powers column | feature 003's training rules                                   |
| synergy partner  | UI event         | the partner control         | opens that hero in the same dialog                             |

## Outputs And Side Effects

| Output / Side Effect | Type  | Description                                                           |
| -------------------- | ----- | --------------------------------------------------------------------- |
| planner state        | write | allocations, bonus levels, powers, flight, resets — all feature 003's |
| open hero            | state | which hero the dialog shows; the roster controls move it              |

The dialog owns no persisted state of its own. Sonar's monster-form toggle stays display-only, exactly as feature 003 defines it.

## Scope And Non-Goals

In scope:

- The dialog's layout contract at both tiers, and the roster control that switches heroes inside it.
- The synergy partner control and the pair's combined stat totals.
- Grouping powers apart from flight and applied effects.
- A reserved notes area.

Non-goals:

- Editing the partner. The pair totals are read-only; the dialog edits one hero.
- Player-written notes. The area is reserved and the copy is authored in the repository; persisting per-hero notes would bump the serialized build format (feature 001, a protected area) and is its own effort.
- Tabs. The mockup's tabbed treatment was considered and rejected — the information fits one screen.
- Changing any planner rule. Budgets, gating, displayed level and effective stat are feature 003's and are untouched.
- A combined-stat _view_ of the pair beyond the totals — that belongs to the Synergy Pairs tab.

## User / System Behavior

- Opening a hero's portrait opens the dialog fullscreen at every tier. The toolbar carries a portrait thumbnail before the hero's name.
- **From `lg`:** a vertical roster rail on the left; then a three-column grid — portrait above the radar in the first column, the stats column spanning both rows, the powers column spanning both rows — with notes across the bottom taking the remaining height.
- **Below `lg`:** the rail becomes a horizontally scrolling ribbon across the top and the large portrait is dropped, the thumbnail in the toolbar standing in for it. Order is radar, stats, synergy partner, powers, notes; each takes only the height it needs and the dialog scrolls.
- The roster shows the current-setup roster **in the same order the overview grid draws it** — each synergy column top then bottom, then episode-8 recruits when shown. The open hero is marked; the others are not.
- The stats column carries the hero's level and bonus count, the bonus and reset controls, the five editable stat rows, the synergy partner control, and the pair totals beneath it.
- Selecting the partner control opens that hero in the same dialog. A hero without a partner shows neither the control nor the totals.
- Changing a stat animates the radar (decision 008).

## Roles And Access

Not role-specific.

## Examples

| Input                                      | Expected Output                                               | Notes                                |
| ------------------------------------------ | ------------------------------------------------------------- | ------------------------------------ |
| open Golem's portrait                      | dialog opens on Golem, rail marks Golem                       |                                      |
| click Flambae in the rail                  | dialog switches to Flambae, stays open                        | no close/reopen                      |
| compare rail order with the overview grid  | identical sequence                                            | pairs top-then-bottom, recruits last |
| Flambae 4 Combat, partner Prism 4 Combat   | pair total Combat 8                                           | sum of effective values              |
| raise Flambae's Combat to 5                | pair total Combat 9; the other four unchanged                 | live                                 |
| a hero with no synergy partner             | no partner control, no pair totals                            |                                      |
| switch from Golem to Blonde Blazer         | dialog geometry unchanged                                     | fixed-level hero, no steppers        |
| Blonde Blazer's stat rows                  | values shown, no `−` / `+`                                    | feature 003: accepts no allocation   |
| Phenomaman with Heavily Medicated selected | no flight card at all                                         | feature 003: removed, not disabled   |
| Sonar, monster form toggled                | displayed stats swap; nothing serialized                      | feature 003                          |
| at 320px                                   | nothing exceeds the viewport; the ribbon scrolls horizontally |                                      |

## Business Rules

- Every value the dialog shows for a hero equals what that hero's card shows. The dialog reads feature 003's state and never recomputes a rule.
- Stat rows use the hero card's treatment, scaled up. The special-power bonus is folded into the number, with no separate breakdown — the card's choice, kept so the two agree.
- **Pair totals are the sum of both heroes' effective stats**, each already carrying allocations and special-power bonuses, and are read-only.
- Powers are grouped apart from flight, Sonar's form toggle and special abilities: the first is what a training is spent on, the second is what the hero already has or gains.
- **The dialog's geometry does not depend on which hero is open.** A fixed-level hero has no steppers and may have no partner; switching to one must not resize or reflow anything.
- Surfaces inside the dialog separate with a border, never the panel drop shadow — that shadow is for panels over the dark ground (annex §6).
- The notes area is present, reserved and non-editable.

## Edge Cases

- Fixed-level heroes (Phenomaman, Blonde Blazer): stat rows render their values and reserve the stepper widths, so the column does not narrow.
- A hero whose partner leaves the roster through an episode change loses the partner control on the next render.
- Episode-8 recruits appear in the roster control only while they are shown.

## Invariants

- The dialog never writes state feature 003 does not already define.
- Only the open hero is editable; no control in the dialog changes another hero.
- The roster control's order matches the overview grid's.
- Nothing in the dialog is persisted; closing it loses nothing and stores nothing.

## Error Handling

No error states. An out-of-budget action is a silent no-op, exactly as feature 003 specifies, and controls disable to match.

## Entry Points

- `web/components/HeroDetailDialog.vue` — the dialog.
- `web/components/_shared/StatRadar.vue` — the chart (decision 008).
- `web/pages/index.vue` — mounts it and owns the open hero.

## Dependencies

- Feature 003: every rule the dialog exposes — budgets, gating, displayed level, effective stat, silent no-ops.
- Feature 002: hero data, the stat icon set, synergy pairs.
- Decision 008: the radar component and its tween.
- `annexes/design-system.md`: panel and border treatment, the type scale, control heights.

## Open Questions

## Tests

- `test/nuxt/hero-detail-dialog.test.ts`: the roster order matches the overview's; switching hero keeps the dialog open; pair totals equal the sum of both heroes' effective stats and follow an edit; a hero without a partner renders neither control nor totals; a fixed-level hero renders no steppers.
- `test/unit/panel-surface.test.ts` (existing): any `panel` added carries `bg-default`.
- A live browser walk for the layout rules — column alignment, the geometry holding across heroes, and 320px.

## Verification

## Agent Change Rules

Before changing this feature, an agent must:

1. Read this feature document.
2. Identify which documented behavior or invariant is affected.
3. Confirm the Status is `Approved` (or later), or ask the user to approve the document first.
4. Add or update tests for the changed behavior.
5. Update this document in the same change if the intended behavior changes.
6. Update `project-summary.md` if the feature summary or status changes.
