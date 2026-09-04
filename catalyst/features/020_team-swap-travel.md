# Feature: Team swap travel

## Status

Approved

## Task Weight

Medium

## Purpose

The mission simulator's team is four positional slots, and the arrows on a filled slot swap it with its neighbour (feature 015). Position is not cosmetic there — Coupé's bonus, Golem's copies and Prism's illusion all derive from slot index — so a swap is a meaningful act, and today it happens as an instant exchange of contents. Two cards change at once with nothing to say which two moved or where they went, which is exactly the information the user needs to confirm the arrow did what they meant.

This makes the swap a **travel**: the two cards move into each other's positions. It changes nothing about what a swap does.

Split from feature 015 rather than amended into it: 015 is at its size budget, and the identity model this needs is a contract of its own.

## Inputs

| Input          | Type            | Source                       | Constraints                                                     |
| -------------- | --------------- | ---------------------------- | --------------------------------------------------------------- |
| slot occupants | `MissionSlot[]` | feature 015's `missionSlots` | four entries: a `HeroId`, an illusion or copy marker, or `null` |
| arrow press    | UI event        | a filled slot's move control | feature 015's `moveMissionSlot`; the mover is always a hero     |
| reduced motion | media query     | `prefers-reduced-motion`     | `reduce` short-circuits the travel                              |

## Outputs And Side Effects

| Output / Side Effect | Type     | Description                                                      |
| -------------------- | -------- | ---------------------------------------------------------------- |
| slot travel          | UI       | the two swapped cards animate into each other's positions        |
| keyboard focus       | UI state | moves to the sibling arrow when the pressed one arrives disabled |

No state is written. Nothing here is serialized, and `missionSlots` gains no field.

## Scope And Non-Goals

In scope:

- The travel itself, and which occupants travel rather than change in place.
- The derived identity that makes travel possible.
- Where keyboard focus goes when the pressed control arrives disabled.

Non-goals:

- **Any change to what a swap does.** `moveMissionSlot`, `withSpawns`, the sanitizing watcher, the totals and the success estimate are feature 015's and are untouched.
- **The serialized format.** No identity token is written to `missionSlots`; the v1 keys (feature 001, a protected area) are not opened.
- **Animating other slot changes** — filling a slot from the picker, removing one, copies dissolving. Those are contentless changes of a slot's occupant; only the swap moves an occupant to a known new position.
- **Drag-and-drop reordering.** The arrows stay the only way to move a hero.
- **The responsive anatomy.** Feature 016 owns how a slot card is built at each tier; the travel applies to whatever it renders.

## User / System Behavior

- **An arrow press makes the two slot cards travel** into each other's positions rather than exchanging contents in place — annex §11 _list move_: `--duration-slow`, `ease-in-out`, `transform` only.
- **The whole card travels**, controls included. The arrows belong to the occupant — the left one is disabled in slot 1, the label names that hero — so a card wearing its neighbour's buttons mid-flight would be a lie.
- **Only heroes travel.** Empty slots, Golem copies and Prism illusions are keyed by position and change where they stand. They have no identity of their own: a copy is interchangeable with any other and there are commonly several, and an empty slot is a gap rather than a thing. So a swap that also spawns or dissolves them shows the two heroes trading places while the derived occupants re-form in their new slots, instantly.
- **Nothing fades in or out**, and **a leaving card leaves the layout at once**. Positional keys change when a hero swaps with an empty slot — one card leaves as another enters — so for the length of the travel the row would otherwise hold five cards in space for four, which is measurably and visibly wrong. There is no leave animation to preserve, so the leaving card is dropped from layout immediately; the card the user is watching is the one travelling, never the one leaving.
- **A second press mid-travel re-aims** the animation at the new position rather than queueing behind it. There is no frame in which the cards on screen disagree with the totals in the math panel.
- **When the pressed arrow arrives disabled** — moving right into slot 4, or left into slot 1 — focus moves to that card's other arrow, so a keyboard user stays on the slot the hero now occupies instead of being dropped to the document.
- Travel is horizontal at every width. The team row never wraps: feature 016 takes four slots down to 59px square at 320 in one row.
- Under `prefers-reduced-motion: reduce` the order changes instantly, as today. The focus move is behaviour rather than decoration and happens either way (annex §14.4).

## Roles And Access

Not role-specific.

## Examples

| Input                                    | Expected Output                       | Notes                               |
| ---------------------------------------- | ------------------------------------- | ----------------------------------- |
| arrow-swap two filled slots              | both cards travel into place          | 250ms, transform only               |
| swap a hero with an empty slot           | the hero travels; the gap does not    | empties are keyed by position       |
| swap Golem, his copies re-forming        | Golem travels, the copies re-form     | derived occupants never travel      |
| swap past Prism, her illusion dissolving | the heroes travel, the illusion goes  | the lifecycle is feature 015's      |
| press the arrow again mid-travel         | the travel re-aims; nothing queues    | cards and totals never disagree     |
| move right into slot 4                   | focus lands on that card's left arrow | the pressed control is now disabled |
| the slot state after any swap            | identical to before this feature      | presentation only                   |
| `prefers-reduced-motion: reduce`         | the order changes instantly           | annex §14.4; focus still moves      |
| 320px viewport                           | the same travel, at 59px slots        | the row never wraps (feature 016)   |

## Business Rules

- **The travel is presentation only.** It reads slot state; it never delays, batches, reorders or suppresses a write. The estimate in the math panel is correct on the first frame of the travel, not at the end of it.
- **Identity is derived, never stored.** Slot values supply none — `null` repeats, and the copy marker repeats once per free slot — so identity is computed for heroes from the hero id, and everything else falls back to its position. `missionSlots` is not given a field to support the animation.
- A slot's identity is stable for as long as that occupant is in the team, and is never reused within one render.
- Keyboard focus is never lost to the document as a result of a swap.

## Edge Cases

- **A swap that also rewrites other slots.** `withSpawns` runs in the same tick as the swap and the sanitizing watcher may write again on the next flush. Positional keying means those writes change what is drawn in a slot without claiming anything travelled.
- **The anatomy changing mid-travel** — a resize across feature 016's 35rem threshold. The travel is abandoned at its current position and the new layout is correct; a half-animated card is never left behind.
- **A swap whose two cards are both derived** cannot occur: `moveMissionSlot` requires the moved slot to hold a hero.
- **A hero swapping with an empty slot** is the common case and the one that churns positional keys. The row's width must not change while it runs.
- **A hero leaving the team mid-travel** (an episode change cutting them). The card is removed rather than landed; the row is correct on the next frame.
- **Arrows on slots 1 and 4** have one direction only, so the disabled-on-arrival case is reachable from both ends.

## Invariants

- The animation never changes what is in a slot, in what order, or when — only how the change is drawn.
- No animation state is serialized, shared, or readable by another feature.
- Every occupant is drawn exactly once per render; a travelling card is never duplicated at its origin and its destination.
- The row's laid-out card count is four at every moment of a swap, and its width does not change.
- Feature 015's success estimate and totals are never observed mid-travel in a state that disagrees with `missionSlots`.

## Error Handling

No failure mode reaches the user. A browser that runs no transition renders the swapped order immediately — the pre-feature behaviour, which is also the reduced-motion behaviour.

## Entry Points

- `web/components/mission/MissionTeamPanel.vue`: the slot row, the derived identity, the travel, and the focus move.
- `web/composables/useMissionSimulator.ts`: `moveMissionSlot` and `withSpawns` — read, not changed.

## Dependencies

- [015_mission-simulator](015_mission-simulator.md): the slots, the arrows, the swap and everything it derives. This feature adds no rule and changes no value.
- [016_mission-simulator-responsive](016_mission-simulator-responsive.md): the slot anatomy the travel carries, and the fact that the row never wraps.
- `annexes/design-system.md` §11 _list move_ and §14.4: the duration, easing, identity rule and reduced-motion guard.

## Open Questions

_None._

## Tests

- `test/nuxt/mission-team.test.ts` (existing file): the derived identity is the hero id for heroes and positional for empties, copies and illusions; identity is unique within a render; a swap leaves exactly the slot state it did before this feature; focus moves to the sibling arrow when the pressed one arrives disabled.
- The travel itself is not asserted in jsdom, which lays nothing out and would let such a test pass while proving nothing — the limit feature 013 records for the same reason. The motion is verified on the live walk.
- Live browser walk of the Examples at desktop and 320px, including a Golem swap, a Prism swap, an interrupted press, and a reduced-motion pass.

## Verification

`test/nuxt/mission-team.test.ts` — 5 new cases (27 in the file): the hero's own DOM node is the one that ends up in the new slot; an empty slot is rebuilt where the gap now is rather than following it; the slots after a swap are exactly what the action alone produces; focus moves to the card's other arrow when the pressed one lands disabled, and stays put when it does not. Full suite 318 passed / 38 files; lint, format and typecheck clean.

Live in Chrome at 1440×900, mission tab. Mid-travel the two cards carry `slot-move` with `transform 0.25s ease-in-out` and mirrored transforms (∓127.7px), and settle swapped as the same DOM nodes. Walking a hero right into slot 4 disables the arrow being pressed and focus lands on that card's left arrow, not the document. With Prism beside a hero, moving her left dissolved her illusion while only the two heroes carried a transform — the derived slots read 0 throughout — and an interrupted press re-aimed the travel (`-128.8 → -63.6`) rather than queueing. At 320×640@2× the slots are 61px, the row holds at 284, the travel runs `-67 → 0`, and the page never scrolls sideways.

One defect found by the walk and fixed here: a hero swapping with an **empty** slot churns positional keys, and the leaving card was staying in the flex row for the full 250ms — five 128px cards measured in space for four, widening the row on the most common swap of all. Leaving cards are now dropped from layout at once; re-measured, the row holds at 564 (desktop) and 284 (320px) with four cards laid out throughout.

Not covered: a `prefers-reduced-motion: reduce` machine — Chrome DevTools has no media emulation for it. The guard is confirmed in the shipped CSSOM as `.slot-move { transition: none }` inside the reduce query.

## Agent Change Rules

Before changing this feature, an agent must:

1. Read this feature document.
2. Identify which documented behavior or invariant is affected.
3. Confirm the Status is `Approved` (or later), or ask the user to approve the document first.
4. Add or update tests for the changed behavior.
5. Update this document in the same change if the intended behavior changes.
6. Update `project-summary.md` if the feature summary or status changes.
