# Feature: Graceful state transitions

## Status

Draft

## Task Weight

Easy

## Purpose

Two surfaces answer a click by making things appear and vanish in a single frame. On the hero card (feature 003), toggling a power, adding a bonus level or resetting a hero mounts and unmounts the reset icon, the flight icon, the bonus button and the chips under the portrait, instantly. In the hero detail dialog (feature 011), switching hero re-renders every panel in place while only the radar travels (decision 008), so the one thing that moves gracefully is surrounded by things that jump.

Both surfaces get the same rule: **content that comes or goes with a state change fades, and a control that stays while its glyph changes swaps it with a scale**. Nothing about what any control does changes.

## Inputs

| Input          | Type          | Source                           | Constraints                                       |
| -------------- | ------------- | -------------------------------- | ------------------------------------------------- |
| card state     | derived flags | feature 003's composables        | the `v-if` conditions each card element has today |
| dialog hero    | `HeroId`      | feature 011's roster rail        | any switch while the dialog stays open            |
| reduced motion | media query   | `prefers-reduced-motion: reduce` | short-circuits the glyph swap; the fade is exempt |

## Outputs And Side Effects

| Output / Side Effect | Type | Description                                                             |
| -------------------- | ---- | ----------------------------------------------------------------------- |
| state fade           | UI   | mounting and unmounting card elements and dialog panels fade in and out |
| glyph swap           | UI   | a control's changing icon or label shrinks away and grows back          |

No state is written. Nothing here is serialized.

## Scope And Non-Goals

In scope:

- The two motions, and the annex §11 rows that settle them as named patterns (**State fade**, **Glyph swap**) so a later instance inherits the values.
- Which card elements and dialog panels each motion applies to.

Non-goals:

- **Any change to what a control does.** Feature 003's budgets and 011's roster switch are read, never altered.
- **Colour-only changes** — the trainable chips swapping which one is active. The annex's baseline colour fade covers them.
- **Values changing in place** — stat numbers, the level readout, pair totals, the synergy-pair markers.
- **The dialog's effect cards** (flight, Sonar, special ability): text cards, not glyphs; the panel fade covers their hero change.
- **The radar**, including on a hero switch. Its tween is decision 008's. Its hardcoded 200ms bypasses the `--duration-*` scale — pre-existing drift, recorded here and not fixed here.
- **Sibling movement** when a chip leaves. Neighbours close the gap when the fade ends; the annex's _list move_ can be added later if the snap earns it.

## User / System Behavior

**State fade** — opacity only, `--duration-baseline`, `ease-out` entering and `ease-in` leaving. Opacity at the baseline needs no reduced-motion guard (annex §14.4).

- On the card: the reset icon, the flight icon, the bonus button and every chip in the row (the trainables, Supernova, En Pointe, Spread Thin, Sonar's form) fade in when their condition becomes true and out when it becomes false. A leaving chip holds its place while it fades; its neighbours close the gap afterwards. The reserved slots and the fixed-height chip row (annex §13) mean nothing else moves.
- In the dialog: on a hero change, each hero-bound panel — the toolbar thumbnail and name, the large portrait, the stats panel, the synergy partner block with its pair totals, the powers and effects panel, the notes panel (feature 022) — fades out with the old hero, then in with the new one. The roster rail and the radar are outside the fade: the rail is stable, the radar keeps its own tween. The top rows are fixed height (feature 011), so the empty moment between the legs moves nothing.

**Glyph swap** — for a control that stays while its icon or label changes: the old glyph scales to zero over `--duration-baseline` with `ease-in`, then the new one grows from zero over `--duration-baseline` with `ease-out`. Transform-based, so it short-circuits under reduced motion and the glyph lands instantly.

- Applies to the bonus button at every step (plus → `+1` → … → `+4`, and back on reset) on both the card and the dialog, to Coupé's chip when En Pointe changes its icon, and to Sonar's form chip.
- Fires only on a change while the control is on screen. First render — page load, a saved build, a share link — never swaps. On `/` the load runs under feature 023's cover, so a swap that fired there would be hidden anyway; the contract stands regardless.
- A swap interrupted by another change re-targets to the newest glyph; nothing queues.

Neither motion depends on viewport width.

## Roles And Access

Not role-specific.

## Examples

| Input                                        | Expected Output                                    | Notes                                |
| -------------------------------------------- | -------------------------------------------------- | ------------------------------------ |
| reveal a hero's starting power               | the reset icon fades in                            | 150ms opacity                        |
| select Flambae's trainable 2                 | the Supernova chip fades in                        | siblings hold, then close after      |
| switch Flambae's trainable 2 → 1             | the Supernova chip fades out; the row stays 24px   | fixed-height row                     |
| switch a hero's trainable 1 → 2              | the active colour moves, no swap and no fade       | colour-only, non-goal                |
| press bonus `+` at bonus 0                   | the plus shrinks away, `+1` grows in               | glyph swap, 150ms + 150ms            |
| press bonus `+` twice quickly                | the swap re-targets to `+2`                        | never shows `+1` once the state is 2 |
| reset a hero at bonus 2 with a trained power | bonus swaps to plus; the reset icon fades out      | both motions on one click            |
| load a share link with Coupé at En Pointe    | the chip renders in its final state, no swap       | change only, never first render      |
| click Flambae in the dialog rail             | portrait, stats, partner, powers fade out, then in | the radar tweens; the rail holds     |
| switch from Golem to Blonde Blazer           | the same fade; dialog geometry unchanged           | feature 011's fixed rows             |
| planner state after any of the above         | identical to before this feature                   | presentation only                    |
| `prefers-reduced-motion: reduce`             | glyphs land instantly; the fades still run         | annex §14.4                          |

## Business Rules

- **Presentation only.** Both motions read state; neither delays, batches or suppresses a write. Budgets, totals and pair markers are correct on the first frame.
- **Durations come from the token scale.** Every transition class reads `--duration-baseline`; a hardcoded duration has bypassed the scale (annex §11).
- **Easing follows the annex:** `ease-out` entering or growing, `ease-in` leaving or shrinking. One baseline per leg for every out-in, panel fade or glyph swap alike.
- **Properties are named**, never `transition: all`.

## Edge Cases

- **Several elements change on one click.** Reset unmounts the reset icon, swaps the bonus glyph and may unmount chips at once. Each runs its own motion in parallel; none waits for another.
- **A hero switch mid-fade** in the dialog re-targets the out leg: the panels enter with the hero selected last, never an intermediate one.
- **A chip toggled on and off within one baseline** is interrupted, never queued; it fades back from wherever it was.
- **Switching to a partnerless hero** removes the dialog's partner block — a state fade of the whole block, with the fixed row keeping the height.
- **`loadInitialBuild` replacing state after hydration** (feature 023) changes every card at once. It is a load, not a change the user made: no glyph swaps.

## Invariants

- No motion changes what a control does, what it shows once settled, or when state changes — only how the change is drawn.
- No animation state is serialized, shared or readable by another feature.
- The card's header slots and chip row keep their reserved size at every moment of a motion; the dialog's fixed rows never resize.
- A control never displays a glyph that disagrees with its state for longer than one swap.
- Every duration the motions use is a `--duration-*` token from `web/assets/css/main.css`.

## Error Handling

No failure mode reaches the user. A browser that runs no transition renders the settled state immediately — the pre-feature behaviour, and the reduced-motion behaviour of the glyph swap.

## Entry Points

- `web/components/HeroCard.vue`: the header-row icons and the bonus button.
- `web/components/HeroPowerChips.vue`: the chip row — the fades and the Coupé and Sonar swaps.
- `web/components/HeroDetailDialog.vue`: the per-panel fades and the dialog's bonus button.
- `annexes/design-system.md` §11: the two named-pattern rows.

## Dependencies

- [003_planner-mechanics](003_planner-mechanics.md): the card state every fade and swap reads. Unchanged.
- [011_hero-detail-dialog](011_hero-detail-dialog.md): the roster switch and the fixed-height rows the panel fade relies on. Unchanged.
- [012_special-powers](012_special-powers.md): the chips and glyphs that come, go and swap.
- [022_hero-notes](022_hero-notes.md): the notes panel that now changes with the hero, and the advisories that come and go.
- [023_initial-load](023_initial-load.md): the cover under which the first load runs; the reason a load never swaps.
- `annexes/design-system.md` §11 and §14.4: tokens, easing, the reduced-motion rule, and the home of the two patterns.
- Decision 008: the radar tween, left as it is.

## Open Questions

- Feature 022's advisories are lines in the notes panel that appear and disappear as the player allocates — content that comes or goes with a state change, by this document's own rule. Do they get the state fade (recommended: yes, the rule is the rule; the panel is a fixed-height scroll region, so nothing outside it moves) or are they excluded as text in a scrolling list?

## Tests

- No automated test. A test that looks for a transition wrapper mirrors implementation, and jsdom lays out and animates nothing (the limit features 013 and 020 record).
- Live browser walk of the Examples table at desktop and 375px: each card action, the interrupted bonus press, a dialog switch to a partnerless and to a fixed-level hero, a share-link load, and the reduced-motion guard confirmed in the shipped CSSOM.

## Verification

_Empty while the document is a draft._

## Agent Change Rules

Before changing this feature, an agent must:

1. Read this feature document.
2. Identify which documented behavior or invariant is affected.
3. Confirm the Status is `Approved` (or later), or ask the user to approve the document first.
4. Add or update tests for the changed behavior.
5. Update this document in the same change if the intended behavior changes.
6. Update `project-summary.md` if the feature summary or status changes.
