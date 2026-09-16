# Feature: Hero dialog transitions

## Status

Active

## Task Weight

Medium

## Purpose

The dialog's motions; [024_graceful-transitions](024_graceful-transitions.md) keeps the hero card. Fading every hero-bound panel on a roster switch would be wrong here: the stats panel's structure is identical for every hero, so fading it re-draws the word "Combat" identically, motion carrying no information.

Three motions instead, each matched to what changes: pictures **fade**, figures **count**, and the two blocks of text the eye reads on a switch — the toolbar name and the notes — **slide**.

## Inputs

| Input          | Type         | Source                           | Constraints                                                               |
| -------------- | ------------ | -------------------------------- | ------------------------------------------------------------------------- |
| dialog hero    | `HeroId`     | feature 011's roster rail        | any switch while the dialog stays open                                    |
| rail position  | `number`     | feature 011's roster order       | old and new hero's rail index; sets the name's direction                  |
| figures        | `number[]`   | features 003, 011, 012           | the five stats, level, bonus and the pair totals                          |
| advisories     | `Advisory[]` | feature 022                      | come and go with allocation while the hero stays                          |
| reduced motion | media query  | `prefers-reduced-motion: reduce` | counts land instantly; slides fall back to the fade; the fades are exempt |

## Outputs And Side Effects

| Output / Side Effect | Type | Description                                                                            |
| -------------------- | ---- | -------------------------------------------------------------------------------------- |
| panel fade           | UI   | the thumbnail, the large portrait and the powers panel fade; so does the partner block |
| value count          | UI   | every figure travels to its new value instead of cutting                               |
| slide                | UI   | the toolbar name and the notes move into place instead of fading in place              |

No state is written. Nothing here is serialized.

## Scope And Non-Goals

In scope:

- The dialog's behaviour on a roster switch, its figures on any change, and its notes list when an advisory fires or clears.
- The annex §11 rows that settle **Value count** and **Slide** as named patterns.

Non-goals:

- **The hero card.** Feature 024 owns it, including the chip row's fade and move.
- **The roster rail and the radar.** The rail is stable across a switch; the radar keeps decision 008's tween, which this feature borrows for the figures rather than changes.
- **The large portrait.** Keeps the fade.

## User / System Behavior

**Fade** — opacity only, `--duration-baseline`, `ease-out` in and `ease-in` out (annex §11, State fade).

- Applies where two heroes show different pictures: the toolbar thumbnail and the large portrait. Each cross-fades in place, keyed by the hero.
- The stats panel, the synergy control and the pair totals never fade: their structure is identical for every hero, so every label, stepper and row holds still. Inside the synergy control only the partner's name cross-fades, in a button whose cell reserves the longest partner name's width.

**Slide** — a short travel with a fade on it: the leaving text moves about half a line height one way as its opacity drops, the arriving text moves the same distance in from the other side as its opacity rises, both at once, clipped to the block's box. `--duration-baseline`, `ease-out` in, `ease-in` out, opacity and `transform` only (annex §11, Slide).

- **The toolbar name** slides in the roster's direction. To a hero later in the rail, the old name leaves toward the rail's start and the new enters from its end — vertically on the rail, horizontally on the ribbon; an earlier hero reverses both. It is the direction the rail itself scrolls to follow the marked hero (feature 019), read from whichever strip is displayed, never from a breakpoint.
- **The thumbnail does not slide.** It cross-fades in a fixed slot beside the text, so the toolbar has one thing moving.
- **The notes** slide as one block in a fixed direction whichever way the roster moved: old note and advisories leave upward, the new enter from below, matching the region's own vertical motion.
- **An advisory that fires or clears while the hero stays** takes the same vertical slide on its own line, and the lines around it travel rather than jump (annex §11, List move, feature 024's chip-row rule). A leaving line is taken out of flow as it goes, so the lines below do not wait.
- **Opening the dialog** shows the name, the notes and the figures with no motion: nothing to arrive from, as the radar already behaved.
- **The synergy partner control** switches hero like a rail click, so the name slides by the same rule from the two rail positions.

**Value count** — a changing number travels to its new value over 200ms on an ease-out cubic, the tween the radar and the mission panel already use. It lands instantly under reduced motion.

- Every figure in the dialog counts: the five stat values, the level readout, the bonus count and the pair totals.
- It counts the same whichever way the number changed: a roster switch and a press of `+` are drawn identically, as the radar beside them already did.
- Figures are rounded from the travelling value; anything deciding state from a number, such as a capped stepper, reads the settled one.

**Powers panel** — it keeps the fade, and nothing else.

- Its headings are the same for every hero but its cards are different text, so the panel fades out and in as one, keyed by the hero (annex §11, State fade). The Effects section comes and goes inside that fade, never on its own.
- A collapse that closed and reopened the lists was rejected: it bought nothing the fade does not and pushed the Effects heading around.

## Roles And Access

Not role-specific.

## Examples

| Input                                       | Expected Output                                                           | Notes                                    |
| ------------------------------------------- | ------------------------------------------------------------------------- | ---------------------------------------- |
| click a hero in the rail                    | thumbnail and portrait fade; the stats panel holds still                  | labels never move                        |
| the same switch, stats                      | every figure counts to the new hero's value                               | the radar tweens alongside               |
| the same switch, name                       | the old name slides up and out, the new slides in from below              | rail direction; the thumbnail only fades |
| the same switch below `lg`                  | sideways: left out, in from the right for a later hero                    | follows the ribbon                       |
| the same switch, notes                      | the whole notes block slides up and out, the new block in from below      | fixed direction, whichever hero          |
| press `+` on Combat until an advisory fires | the new line slides in from below; the lines after it travel to make room | nothing jumps                            |
| undo that press                             | the line slides up and out; the lines after it travel back                | out of flow as it leaves                 |
| switch to a hero with no effects            | the powers panel fades as one; the effects section is absent after        | inside the fade                          |
| switch to Blonde Blazer                     | the partner block fades out entirely                                      | no partner to cross-fade to              |
| open the dialog from a card                 | name, notes and figures are simply there                                  | no arrival motion                        |
| click the synergy partner control           | the name slides by the rail rule                                          | same as a rail click                     |
| a second rail click mid-motion              | everything re-targets to the hero clicked last                            | direction from the arriving hero         |
| `prefers-reduced-motion: reduce`            | counts land instantly; the slides fall back to fades; fades still run     | annex §14.4                              |

## Business Rules

- **Presentation only.** The motions read state; none delays, batches or suppresses a write.
- **Durations, easing and named properties follow annex §11**, except the value count: a JavaScript tween whose 200ms is the radar's, kept so the two agree.
- **A slide is transform-based**, so it carries the annex's reduced-motion guard, degrading to the fade rather than a cut.

## Edge Cases

- **A switch mid-motion** re-targets every leg from wherever it has reached, to the hero clicked last. The name's direction is computed from the hero that was arriving: that is the name the user saw.
- **A partnerless hero** has no pair totals; that block fades out instead of counting.
- **The notes region is scrolled when the switch happens.** The new block arrives at the top and the region is left there.
- **The notes block is taller than its region.** The slide is clipped by the region's box; only the visible part moves.
- **Feature 023's first load** replaces state after hydration: a load, not a change, and the dialog is not open anyway.

## Invariants

- No motion changes what a control does, what it shows once settled, or when state changes.
- Nothing in the stats column changes size or position on a switch. Only figures and the partner's own name change at all.
- The toolbar's height and the thumbnail's slot are identical throughout a slide; the text moves inside a clipped box.
- Feature 011's fixed rows never resize, and the dialog's outer geometry is identical throughout.
- No animation state is serialized or readable by another feature.

## Error Handling

No failure mode reaches the user. A browser that runs no transition renders the settled state at once, which is also the reduced-motion behaviour.

## Entry Points

- `web/components/HeroDetailDialog.vue`: the name's directional slide and its rail-position lookup, and the thumbnail and portrait fades; `HeroStatsPanel.vue`: the figure count and the partner fades; `HeroPowersPanel.vue`: the panel fade; `HeroNotesPanel.vue`: the notes' slide and move.
- `web/assets/css/motion.css`: the `slide` transition classes beside `state-fade` and `glyph-swap`.
- `web/composables/useTweenedValues.ts`: the tween the figures share with the radar and the mission panel.
- `annexes/design-system.md` §11: **Value count** and **Slide** as named patterns.

## Dependencies

- [011_hero-detail-dialog](011_hero-detail-dialog.md): the roster switch, the panels and the fixed rows. Unchanged.
- [019_roster-follow](019_roster-follow.md): the rail's own direction of travel, which the name's slide agrees with.
- [022_hero-notes](022_hero-notes.md): the note and advisories that slide; content and order are its.
- [024_graceful-transitions](024_graceful-transitions.md): the card's motions, the State fade reused here, the list move the advisories borrow.
- [012_special-powers](012_special-powers.md): the effects that come and go inside the powers fade.
- Decision 008: the radar's tween, borrowed for the figures.

## Open Questions

## Tests

- No automated test. A test that looks for a transition wrapper mirrors implementation, and jsdom lays out and animates nothing (the limit features 013 and 020 record).
- Live browser walk of the Examples table at desktop and 375px, measuring the stats column's stillness, the figures counting, the name's direction against the rail's, and that no notes line jumps when an advisory fires.

## Verification

Suite, typecheck, lint and format clean. Walked at 1500 and 375, the Examples table row by row — including the name's direction agreeing with the rail both ways and on x at 375, an interrupted click measuring from the arriving hero, advisories firing and clearing without a line jumping, the stats column held still while every figure counted, and a reduced-motion pass where the transforms read `none` while the opacities still cross.

## Agent Change Rules

Before changing this feature, an agent must:

1. Read this feature document.
2. Identify which documented behavior or invariant is affected.
3. Confirm the Status is `Approved` (or later), or ask the user to approve the document first.
4. Add or update tests for the changed behavior.
5. Update this document in the same change if the intended behavior changes.
6. Update `project-summary.md` if the feature summary or status changes.
