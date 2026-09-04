# Feature: Hero dialog transitions

## Status

Draft

## Task Weight

Medium

## Purpose

Split from [024_graceful-transitions](024_graceful-transitions.md), which keeps the hero card. That feature gave the dialog the same blunt rule it gave the card: on a roster switch, every hero-bound panel faded out and back in. Use showed the rule was wrong here. The stats panel's structure is identical for every hero, so fading it re-drew the word "Combat" identically, which is motion carrying no information. The powers panel keeps its headings too, and only its cards differ.

This feature says what the dialog does instead. Three motions, each matched to what actually changes: content that genuinely swaps **fades**, figures **count** to their new value, and the powers panel **collapses and reopens** around headings that stay.

## Inputs

| Input          | Type        | Source                           | Constraints                                           |
| -------------- | ----------- | -------------------------------- | ----------------------------------------------------- |
| dialog hero    | `HeroId`    | feature 011's roster rail        | any switch while the dialog stays open                |
| figures        | `number[]`  | features 003, 011, 012           | the five stats, level, bonus and the pair totals      |
| section height | `number`    | measured from the live panel     | the powers section's height before and after a switch |
| `hasEffects`   | `boolean`   | feature 011                      | false for a hero with no shown flight or ability      |
| reduced motion | media query | `prefers-reduced-motion: reduce` | counts land; the collapse short-circuits              |

## Outputs And Side Effects

| Output / Side Effect | Type | Description                                                        |
| -------------------- | ---- | ------------------------------------------------------------------ |
| panel fade           | UI   | the portrait, name and notes panel fade; so does the partner block |
| value count          | UI   | every figure travels to its new value instead of cutting           |
| section collapse     | UI   | the powers and effects lists close to nothing and reopen           |
| heading travel       | UI   | the Effects heading makes one journey to its new resting position  |

No state is written. Nothing here is serialized.

## Scope And Non-Goals

In scope:

- The dialog's behaviour on a roster switch, and its figures on any change.
- The annex §11 rows that settle **Value count** and **Section collapse** as named patterns.

Non-goals:

- **The hero card.** Feature 024 owns it, including the chip row's fade and move.
- **The roster rail and the radar.** The rail is stable across a switch; the radar keeps decision 008's tween, which this feature borrows for the figures rather than changes.
- **Counting outside this dialog.** The card's figures and the synergy-pair markers still change in place.
- **The dialog's bonus control.** A fixed plus beside a count: no glyph to swap, and the count is what counts.
- **Feature 011's layout.** Every fixed row and reserved height is read, never altered.

## User / System Behavior

**Fade** — opacity only, `--duration-baseline`, `ease-out` in and `ease-in` out (annex §11, State fade).

- Applies where two heroes genuinely show different things: the toolbar thumbnail and name, the large portrait, and the notes panel (feature 022), whose advisories take the same fade as they come and go inside a fixed-height scroll region.
- The stats panel, the synergy control and the pair totals never fade. Their structure is identical for every hero, so the labels, captions, steppers, synergy button and pair-total rows all hold still. Inside the synergy control only the partner's own name cross-fades — the control carries no portrait — in a button that never moves. Its cell reserves the width of the longest name any partner can have, so the label beside it cannot re-centre.

**Value count** — a changing number travels to its new value over 200ms on an ease-out cubic, the tween the radar and the mission panel already use. It lands instantly under reduced motion.

- Every figure in the dialog counts: the five stat values, the level readout, the bonus count and the pair totals.
- It counts the same whichever way the number changed, so a roster switch and a press of `+` are drawn identically. The radar beside them already tweened on both, and a figure that jumped while the radar glided disagreed with it.
- Figures are rounded from the travelling value; anything reading a number to decide state, such as a capped stepper, reads the settled one so it cannot flicker mid-count.

**Section collapse** — the powers panel keeps its headings and exchanges its contents underneath them.

- The **Powers** heading never moves. The powers list and the effects list each close to nothing and reopen carrying the new hero's cards.
- The **Effects** heading makes exactly one journey. Its resting position is computed from the new powers list's height before the motion starts, so it travels straight there rather than riding the collapse up and the reopen back down.
- Two legs, not three: the heading's travel runs underneath the close and the reopen rather than waiting between them, so a switch lands in about `--duration-slow` rather than stacking three baselines. The rail invites fast clicking, and a sequence that reads as deliberate once reads as sluggish by the fifth.
- **Height is what animates, and the content is clipped, not squashed.** A vertical scale would distort three lines of description a reader may still be looking at.
- A hero with no effects is a height of zero and needs no special case: the section closes and does not reopen. One arriving grows from nothing.
- Transform- and height-based, so it short-circuits under reduced motion: the panel lands on the new contents with the heading already in place.

## Roles And Access

Not role-specific.

## Examples

| Input                                    | Expected Output                                            | Notes                               |
| ---------------------------------------- | ---------------------------------------------------------- | ----------------------------------- |
| click a hero in the rail                 | portrait, name and notes fade; the stats panel holds still | labels never move                   |
| the same switch, stats                   | every figure counts to the new hero's value                | the radar tweens alongside          |
| the same switch, powers                  | both lists close and reopen; Powers heading holds          | two legs, about `--duration-slow`   |
| switch to a hero whose powers are taller | the Effects heading travels once, straight to its place    | height known before the motion runs |
| switch to a hero with no effects         | the effects section closes and does not reopen             | absence is a height of zero         |
| switch to a hero that gains effects      | the section grows from nothing                             | the same motion, reversed           |
| switch to Blonde Blazer                  | the partner block fades out entirely                       | no partner to cross-fade to         |
| press `+` on a stat                      | the value counts up; the radar tweens with it              | same motion as a switch             |
| a second rail click mid-motion           | everything re-targets to the hero clicked last             | nothing queues                      |
| planner state after any of the above     | identical to before this feature                           | presentation only                   |
| `prefers-reduced-motion: reduce`         | counts and the collapse land; the fades still run          | annex §14.4                         |

## Business Rules

- **Presentation only.** The motions read state; none delays, batches or suppresses a write.
- **Durations come from the token scale**, except the value count, which is no CSS transition at all: a JavaScript tween whose 200ms is the radar's, kept so the two agree (annex §11).
- **Easing follows the annex:** `ease-out` entering or growing, `ease-in` leaving or closing.
- **Properties are named**, never `transition: all`.
- The Effects heading's target is measured before the old contents leave. A motion that discovers its destination halfway is a motion that changes direction.

## Edge Cases

- **A switch mid-motion** re-targets every leg from wherever it has reached. The panel reopens on the hero clicked last, never an intermediate one.
- **A hero with a different stat count** cannot occur: all five stats always exist, so a count always has a value to travel from. A partnerless hero has no pair totals, and that block fades out instead.
- **The panel is scrolled when the switch happens.** Collapsing its contents shortens the scroll range; the panel is left at the top rather than at an offset that no longer means anything.
- **A hero with neither powers nor effects** cannot occur: every hero has powers.
- **Feature 023's first load** replaces state after hydration. That is a load, not a change the user made: no collapse and no count, and the dialog is not open anyway.

## Invariants

- No motion changes what a control does, what it shows once settled, or when state changes.
- Nothing in the stats column changes size or position on a switch. Only figures and the partner's own name change at all.
- The Powers heading is at the same offset before, during and after a switch.
- Feature 011's fixed rows never resize, and the dialog's outer geometry is identical throughout.
- No animation state is serialized or readable by another feature.

## Error Handling

No failure mode reaches the user. A browser that runs no transition renders the settled state immediately, which is the pre-feature behaviour and also the reduced-motion behaviour.

## Entry Points

- `web/components/HeroDetailDialog.vue`: the fades that remain, the stats column that no longer fades, the powers panel's collapse, and the notes list's advisories.
- `web/composables/useTweenedValues.ts`: the tween the figures share with the radar and the mission panel.
- `annexes/design-system.md` §11: **Value count** and **Section collapse** as named patterns.

## Dependencies

- [011_hero-detail-dialog](011_hero-detail-dialog.md): the roster switch, the panels and the fixed rows. Unchanged.
- [024_graceful-transitions](024_graceful-transitions.md): the card's motions, and the State fade this feature reuses.
- [012_special-powers](012_special-powers.md) and [022_hero-notes](022_hero-notes.md): the effects and the notes that come and go.
- Decision 008: the radar's tween, borrowed for the figures.

## Open Questions

_None._

## Tests

- No automated test. A test that looks for a transition wrapper mirrors implementation, and jsdom lays out and animates nothing (the limit features 013 and 020 record).
- Live browser walk of the Examples table at desktop and 375px, measuring the Powers heading's offset across a switch, the Effects heading's travel, and the stats column's stillness.

## Verification

Empty while this document is a draft. The panel fades this feature narrows were verified under feature 024 on 2026-09-04; that evidence does not carry, because what they applied to is what changes here.

## Agent Change Rules

Before changing this feature, an agent must:

1. Read this feature document.
2. Identify which documented behavior or invariant is affected.
3. Confirm the Status is `Approved` (or later), or ask the user to approve the document first.
4. Add or update tests for the changed behavior.
5. Update this document in the same change if the intended behavior changes.
6. Update `project-summary.md` if the feature summary or status changes.
