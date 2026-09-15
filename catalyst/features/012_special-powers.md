# Feature: Special powers

## Status

Active

## Task Weight

Medium

## Purpose

The display-only stat effects a hero's power grants once it is trained — Flambae's Supernova, Coupé's En Pointe, Golem's Spread Thin, and Sonar's form swap. Feature 003 owns the training _budgets_ and the roster layout; these effects have their own state field, their own serialized key, their own chip on every card, and rules that grow with each hero who gets a toggle. Nothing here allocates anything; every effect is computed from state feature 003 already holds.

## Inputs

| Input                | Type     | Source                                 | Constraints                                                           |
| -------------------- | -------- | -------------------------------------- | --------------------------------------------------------------------- |
| special power toggle | UI event | the card's special chip, or the dialog | gated on the required trainable power; cycles, never wraps past `max` |
| sonar form toggle    | UI event | any surface rendering Sonar            | one shared display state — never serialized                           |

## Outputs And Side Effects

| Output / Side Effect     | Type           | Description                                                                                                                                                                               |
| ------------------------ | -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `heroSpecialPowers`      | `useState` ref | one integer per hero — feature 001 serializes it as `sp`                                                                                                                                  |
| effective stats          | rendered       | `startingStats + allocations + specialPowerBonus`, per stat                                                                                                                               |
| chip state               | rendered       | the chip's colour, active flag and label at the current step                                                                                                                              |
| chip hint / confirmation | rendered       | the tooltip text here is a hint (feature 018): hover-only, shown on a hover-capable device; a no-hover tap shows a confirmation naming the resulting state instead, never the hint's text |

## Scope And Non-Goals

In scope:

- The four special effects, their gating on a trained power, their stat math, and how each is labelled on the card and in the detail dialog.
- The shape `SPECIAL_POWER_MECHANICS` takes, and the `special_powers` block the game-data export derives from it for the API validator.

Non-goals:

- Training budgets, reveal/select gating, per-hero and shared resets — feature 003.
- The detail dialog's layout and its pair-total block — feature 011; this document owns only the rule that block applies to Golem.
- Modelling powers that are not stat effects (Pirouette, Wolf Pack, Portal Ritual, …) — they are described on the card, never computed.
- Golem's Diamond in the Rough: it fires at random on calls the planner cannot know about, so modelling it means inventing a "pretend it procced on stat X" picker — and a second special toggle, which neither the four-chip strip nor the one-integer `sp` slot has room for.

## User / System Behavior

**Supernova** (Flambae, requires trainable-2). On/off. Raises Combat and Mobility to 10 by contributing whatever the gap is.

**En Pointe** (Coupé, starting power, so ungated). Cycles off → +Combat → +Mobility. +1 normally, +3 once À la Seconde is trained; the bonus shrinks where needed so the effective stat never passes 10.

**Spread Thin** (Golem, requires trainable-1). Cycles off → 1 slot → 2 slots → 3 slots, standing for the empty call slots he expands into. Each step adds `floor((startingStats + allocations) × 0.25 × slots)` to **every** stat. The chip is labelled by slot count (`+2 slots`), with the percentage in its tooltip — slots are what the player is deciding at the dispatch screen; the percentage is the mechanism.

**Sonar's form.** A monster-form toggle that swaps Combat↔Intellect and Vigor↔Charisma in the display only. The state is shared: one form across every surface that renders him (card, dialog, synergy tab — feature 014), toggled from any of them. It has no `SPECIAL_POWER_MECHANICS` entry and no serialized state.

**Clearing.** Un-revealing the starting power, training the other trainable, the per-hero reset, and `Reset all trainings` each clear the hero's special state.

## Roles And Access

Not role-specific.

## Examples

| Input                                         | Expected Output                                   |
| --------------------------------------------- | ------------------------------------------------- |
| Supernova on Flambae (4 combat, +2 allocated) | Combat shows 10 (+4 special bonus, never past 10) |
| Spread Thin at 2 slots, Golem Combat 6        | Combat shows 9 (`floor(6 × 0.5)` = +3)            |
| Spread Thin at 3 slots, Golem Intellect 1     | Intellect shows 1 (`floor(0.75)` = +0)            |
| Spread Thin at 3 slots, Golem Vigor 9         | Vigor shows 10, not 15 (`MAX_STAT_VALUE`)         |
| En Pointe +3 on Coupé at 9 combat             | Combat shows 10, not 12 (`MAX_STAT_VALUE`)        |
| toggle a gated effect without its trainable   | no-op, chip disabled                              |
| Spread Thin at 3 slots, Golem's pair total    | pair credits 2 slots only — the partner fills one |
| Golem's pair total, Spread Thin untrained     | no deduction note above the totals                |
| un-reveal a trained hero's starting power     | trainable and special power cleared together      |

## Business Rules

- Effective displayed stat = `startingStats + allocations + specialPowerBonus`, per stat, and never exceeds `MAX_STAT_VALUE`: every special bonus is clamped against what the stat already holds. Special bonuses are computed, never written into `heroLevelUps`.
- Spread Thin's bonus is `floor((startingStats + allocations) × 0.25 × slots)` per stat, clamped to `MAX_STAT_VALUE`. The tier is picked by the slot count and floored **once** against the total — not a per-slot increment repeated, which pays differently on any stat that is not a multiple of 4.
- Golem fills at most three slots (+75%): calls hold four and he occupies one. Squeeze In's fifth slot is Punch Up's alone and never empty, so the source's "up to 200%" is unreachable. The formula and the ceiling are a reading of loose source text, recorded beside the power in `context/game-mechanics.md`, not a measurement.
- **Feature 011's pair total is a two-hero call**, so it re-derives Spread Thin at `min(slots, 2)` — the partner fills a slot Golem would have. His own rows keep all three; each figure is right for its label. The rule is about the pair being two heroes, not about Invisigal, and stays true if the conditional synergy pairs change. The one-line note explaining that deduction appears only while the power is contributing — with Spread Thin untrained there is nothing subtracted and the line would describe arithmetic the reader cannot see.
- A gated effect is inert without its trainable power selected, guarded in state and disabled in the UI (feature 003's guard-clause convention).
- `SPECIAL_POWER_MECHANICS` (`web/types/hero.ts`) is the single source: `scripts/export-game-data.ts` derives `special_powers` (`max`, `requires_trainable`) from it rather than restating it. A hand-copied value that drifts lets the client offer a step the API rejects on save — a bug visible only at persistence.
- The card's power strip holds at most **four** chips — `sonar form? + starting + upgrades(≤2) + special?` — and a fifth breaks every card's alignment (annex §13, Card body). A second toggle for any hero must first move something out of the strip, the way flight was moved.

## Edge Cases

- Coupé's En Pointe applies +1 even untrained, +3 only with À la Seconde.
- A stat below 4 gains nothing from Spread Thin's first slot (`floor(3 × 0.25)` = 0), and a stat of 1 gains nothing at any slot count. That is the floor working as specified, not a missing bonus.
- Sonar's form toggle occupies a chip but no state; it is the reason his strip is the tightest of the roster.

## Invariants

- `heroSpecialPowers` is one integer per hero and feature 001 serializes it as `sp` — widening it to hold two effects for one hero is a change to the protected build format.
- Every serialized `sp` value satisfies the API's `_special_range`: `0 ≤ state ≤ max`, and `requires_trainable` matches the hero's trained slot.

## Error Handling

- No error states: an ineligible toggle is a silent no-op with the chip disabled.

## Entry Points

- `web/composables/useHeroPowerTraining.ts`: `toggleSpecialPower`, `getSpecialPowerBonus`, `allSpecialPowerBonuses`.
- `web/types/hero.ts`: `SPECIAL_POWER_MECHANICS`.
- `web/components/HeroCard.vue` (the chip), `web/components/HeroPowersPanel.vue` (the effect row) and `web/components/HeroStatsPanel.vue` (the pair total).
- `scripts/export-game-data.ts` → `shared/game-data.json` → `app/services/validation.py`.

## Dependencies

- Feature 003 (planner mechanics): owns the power training these effects gate on, and the resets that clear them.
- Feature 002 (hero data), feature 001 (build persistence), feature 011 (the dialog surfaces).
- Feature 018 (hints and confirmations): owns the hint/confirmation split on every chip's tooltip text, including the wording of each chip's confirmation.

## Open Questions

## Tests

- `test/nuxt/spread-thin.test.ts`: the trainable-1 gate, the `0 → 1 → 2 → 3 → 0` cycle, the bonus at each slot count against a floor-sensitive stat (6) and one that never moves (1), the `MAX_STAT_VALUE` clamp, the pair total's `min(slots, 2)` re-derivation, and the deduction note's presence rule.
- `test/nuxt/en-pointe.test.ts`: the base/upgraded bonus and the clamp (9 + 3 shows 10; a stat at 10 gains nothing).
- `shared/build-cases.json`: `sp` range and gating cases for Golem. Supernova and Sonar's form ride on `test/nuxt/hero-detail-dialog.test.ts` and the feature 003 walk.

## Verification

By test: every case under Tests, including Combat 6 yielding +1 / +3 / +4 — the value where a floored tier and a repeated per-slot increment disagree. Walked live in Chrome: training Spread Thin adds a fourth chip and no more; clicking it stepped the card through `+1 slot (+25%)` → `+2 slots (+50%)` → `+3 slots (+75%)` with every stat matching the formula, the ones that never move included; the dialog's Effects row named the expansion while the Golem pair total counted him at two slots against his own rows' three, with the deduction note shown only while the power contributed. Frontend and backend validation suites, `vue-tsc` and `oxlint` pass.

## Agent Change Rules

Before changing this feature, an agent must:

1. Read this feature document.
2. Identify which documented behavior or invariant is affected.
3. Confirm the Status is `Approved` (or later), or ask the user to approve the document first.
4. Add or update tests for the changed behavior.
5. Update this document in the same change if the intended behavior changes.
6. Update `project-summary.md` if the feature summary or status changes.
