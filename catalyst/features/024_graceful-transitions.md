# Feature: Hero card transitions

## Status

Active

## Task Weight

Easy

## Purpose

The hero card (feature 003) answers a click by making things appear and vanish in a single frame: toggling a power, adding a bonus level or resetting a hero mounts and unmounts the reset icon, the flight icon, the bonus button and the chips under the portrait, instantly.

The card gets two motions: **content that comes or goes with a state change fades, and a control that stays while its glyph changes swaps it with a scale**. Nothing about what any control does changes.

Use then found the fade applied too bluntly in one place. The chip row is centre-justified, so a chip fading in left its neighbours to jump into their new positions in a single frame. The row needs the annex's move as well as its fade, which this document now carries.

The dialog was originally this feature's second surface. It is [025_dialog-transitions](025_dialog-transitions.md) now, split off when what it needed stopped being a fade.

## Inputs

| Input          | Type          | Source                           | Constraints                                       |
| -------------- | ------------- | -------------------------------- | ------------------------------------------------- |
| card state     | derived flags | feature 003's composables        | the `v-if` conditions each card element has today |
| reduced motion | media query   | `prefers-reduced-motion: reduce` | short-circuits the glyph swap; the fade is exempt |

## Outputs And Side Effects

| Output / Side Effect | Type | Description                                                    |
| -------------------- | ---- | -------------------------------------------------------------- |
| state fade           | UI   | mounting and unmounting card elements fade in and out          |
| glyph swap           | UI   | a control's changing icon or label shrinks away and grows back |

No state is written. Nothing here is serialized.

## Scope And Non-Goals

In scope:

- The two motions, and the annex §11 rows settling them as named patterns (**State fade**, **Glyph swap**), plus the note allowing a list to carry a fade and a move at once.
- Which card elements each motion applies to.

Non-goals:

- **Any change to what a control does.** Budgets and the roster switch are read, never altered.
- **Colour-only changes**, such as which trainable chip is active. The annex's baseline colour fade covers them.
- **The hero detail dialog.** Feature 025 owns it, including the figures that count and the powers panel's collapse.
- **Movement anywhere but the chip row.** Reserved slots leave no neighbour to displace.
- **Values changing in place** on the card: stat numbers, the level readout, the synergy-pair markers.

## User / System Behavior

**State fade** — opacity only, `--duration-baseline`, `ease-out` entering and `ease-in` leaving. Opacity at the baseline needs no reduced-motion guard (annex §14.4).

- The reset icon, the flight icon, the bonus button and every chip in the row fade in when their condition becomes true and out when it becomes false. The reserved slots and the fixed-height row (annex §13) mean nothing else moves.
- **The chip row also moves.** It is centre-justified, so a chip arriving or leaving re-centres every other one. The neighbours travel under the annex's _list move_ instead of jumping, and a leaving chip leaves the flow as its fade begins so the travel and the fade run together.

**Glyph swap** — a control that stays while its icon or label changes: the old glyph scales to zero over `--duration-baseline` with `ease-in`, then the new one grows from zero with `ease-out`. Transform-based, so it short-circuits under reduced motion.

- Applies to the bonus button at every step (plus → `+1` → … → `+4`, and back on reset), to Coupé's chip when En Pointe changes its icon, and to Sonar's form chip.
- Fires only on a change while the control is on screen. A first render — page load, saved build, share link — never swaps; feature 023's wait would hide one anyway, but the contract stands regardless.
- A swap interrupted by another change re-targets to the newest glyph; nothing queues.

Neither motion depends on viewport width.

## Roles And Access

Not role-specific.

## Examples

| Input                                     | Expected Output                                     | Notes                                |
| ----------------------------------------- | --------------------------------------------------- | ------------------------------------ |
| reveal a hero's starting power            | the reset icon fades in                             | 150ms opacity                        |
| select Flambae's trainable 2              | the chip fades in where it lands; neighbours travel | it never slides                      |
| switch Flambae's trainable 2 → 1          | the chip fades out where it stands; the rest travel | out of flow, but it does not move    |
| switch a hero's trainable 1 → 2           | the active colour moves, no swap and no fade        | colour-only, non-goal                |
| press bonus `+` at bonus 0                | the plus shrinks away, `+1` grows in                | glyph swap, 150ms each leg           |
| press bonus `+` twice quickly             | the swap re-targets to `+2`                         | never shows `+1` once the state is 2 |
| reset at bonus 2 with a trained power     | bonus swaps to plus; the reset icon fades out       | both motions on one click            |
| load a share link with Coupé at En Pointe | the chip renders settled, no swap                   | change only, never first render      |
| planner state after any of the above      | identical to before this feature                    | presentation only                    |
| `prefers-reduced-motion: reduce`          | glyphs land instantly; the fades still run          | annex §14.4                          |

## Business Rules

- **Presentation only.** The motions read state; none delays, batches or suppresses a write. Budgets, totals and pair markers are correct on the first frame.
- **Durations come from the token scale.** Every transition class reads a `--duration-*` token; a hardcoded one has bypassed it (annex §11).
- **Easing follows the annex:** `ease-out` entering or growing, `ease-in` leaving or shrinking, one baseline per leg.
- **Properties are named**, never `transition: all`.

## Edge Cases

- **Several elements change on one click.** Reset unmounts an icon, swaps the bonus glyph and may unmount chips at once. The motions run in parallel.
- **A chip toggled on and off within one baseline** is interrupted, never queued.
- **`loadInitialBuild` replacing state after hydration** (feature 023) changes every card at once. A load, not a change the user made: no glyph swaps.

## Invariants

- No motion changes what a control does, what it shows once settled, or when state changes; only how the change is drawn.
- No animation state is serialized or readable by another feature.
- The card's header slots and chip row keep their reserved size throughout, including while a chip is out of flow.
- A control never displays a glyph that disagrees with its state for longer than one swap.
- Every duration the motions use is a `--duration-*` token from `web/assets/css/main.css`.

## Error Handling

No failure mode reaches the user. A browser running no transition renders the settled state immediately: the pre-feature behaviour, and the reduced-motion behaviour of the glyph swap.

## Entry Points

- `web/components/HeroCard.vue`: the header-row icons and the bonus button.
- `web/components/HeroPowerChips.vue`: the chip row's fade, move and the Coupé and Sonar swaps.
- `annexes/design-system.md` §11: the named-pattern rows, and the note allowing a fade and a move on one list.

## Dependencies

- [003_planner-mechanics](003_planner-mechanics.md): the card state every motion reads. Unchanged.
- [012_special-powers](012_special-powers.md): the chips and glyphs that come, go and swap.
- [023_initial-load](023_initial-load.md): the wait the first load runs under; the reason a load never swaps.
- [025_dialog-transitions](025_dialog-transitions.md): the dialog half, split out of this feature.
- `annexes/design-system.md` §11 and §14.4: tokens, easing, the reduced-motion rule, and the patterns' home.

## Open Questions

_None._

## Tests

- No automated test. A test looking for a transition wrapper mirrors implementation, and jsdom lays out and animates nothing (the limit features 013 and 020 record).
- Live browser walk of the Examples table at desktop and 375px: each card action, the interrupted bonus press, chip neighbours travelling rather than jumping when one arrives and when one leaves, a share-link load, and the reduced-motion guard read from the CSSOM.

## Verification

**Card motions (2026-09-04).** Lint, typecheck and suite clean; walked in headless Chrome at 1905px and 375px. The reset icon, Supernova's chip, the bonus swap (two fast presses re-targeting to `+3`), a reset running both motions at once, and Coupé's glyph swap all behaved; a share link loaded with no motion. The walk found both button components rendering fragments, which `Transition` cannot animate, so every transitioned element now sits in a plain span. Sonar's chip and a reduced-motion machine were not covered.

**Chip movement (2026-09-04).** Suite 387 passing across 49 files, typecheck, lint and format clean. Walked in Chrome on the dev server, measuring positions frame by frame on Coupé revealing and hiding En Pointe. Before: the three existing chips jumped 14px left in a single frame at full opacity. After: they travel under the move while the fourth fades, and the chip that comes or goes holds its own x throughout — the arriving one at 231 as its opacity climbs, the leaving one at 231 as it falls, where the row centre it would otherwise snap to is 201. Two defects the walk caught and fixed: the move class lands on the entering and leaving elements too, so both slid while fading until each was given a fade-only rule after the move rule; and taking the leaver out of flow put it under the row's centring, which is why its offsets are pinned in `beforeLeave`.

## Agent Change Rules

Before changing this feature, an agent must:

1. Read this feature document.
2. Identify which documented behavior or invariant is affected.
3. Confirm the Status is `Approved` (or later), or ask the user to approve the document first.
4. Add or update tests for the changed behavior.
5. Update this document in the same change if the intended behavior changes.
6. Update `project-summary.md` if the feature summary or status changes.
