# Feature: Hero notes

## Status

Active

## Task Weight

Medium

## Purpose

The hero detail dialog's notes panel (feature 011) has stood reserved and empty since it shipped. This feature fills it with two kinds of authored guidance: a **hero note**, one always-shown line of non-obvious characterization per hero, and an **advisory**, a line that appears or disappears as the player allocates, warning about a wasted spend or flagging a build worth doing. Both are read-only and display-only, sourced from `context/game-mechanics.md`, never persisted, never player-authored.

## Inputs

| Input         | Type     | Source                                                                              | Constraints                                                  |
| ------------- | -------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| open hero     | `HeroId` | the dialog (feature 011)                                                            | the hero the panel renders for                               |
| planner state | derived  | `heroLevelUps`, `heroBonusLevels`, `heroPowers`, `heroSpecialPowers`, episode setup | read-only; every advisory predicate is a pure function of it |

## Outputs And Side Effects

| Output / Side Effect | Type     | Description                                                                 |
| -------------------- | -------- | --------------------------------------------------------------------------- |
| notes panel content  | rendered | one hero note, then zero or more advisories, in the dialog's existing panel |

No state is written. No new `useState` key, no serialized build field, no API surface.

## Scope And Non-Goals

In scope:

- The `HERO_NOTES` copy — one entry per hero, plus Waterboy's episode-8 variant.
- The `HERO_ADVISORIES` catalogue — ten entries, each a predicate over planner state plus its copy.
- Rendering order inside the panel feature 011 already reserved.
- Amendments to `context/game-mechanics.md` recording the sourced facts these notes assert.

Non-goals:

- Player-authored or persisted notes — still out of scope, as feature 011 already states; nothing here touches the serialized build format (feature 001, protected).
- New planner state, new budgets, or any change to allocation rules — every predicate reads state feature 003/012 already owns.
- A card-level indicator that a hero has advisories — the card is already at its four-chip limit (feature 012); discovery is by opening the dialog.
- Severity ranking or filtering. All applicable advisories always show; declaration order is the only ordering.
- A synergy-pair build recommendation as strict advice (e.g. "take À la Seconde") — the community guides themselves disagree on it; only the arithmetic once the choice is already made ships (advisory 9).
- An invented level cap on a late-hired Waterboy — unsourced; the note states only sourced mechanical facts.

## User / System Behavior

- The panel (feature 011, `HeroDetailDialog.vue:432-447`) renders, in order: the open hero's **hero note**, then every **advisory** whose predicate is currently true — warnings before suggestions, each group in the catalogue's declaration order below.
- Order depends only on which entries are true, never on their values — a hero with three warnings always shows them in the same relative order regardless of which stat triggered which.
- The panel stays the fixed-height `ScrollRegion` feature 011/013 already define; content beyond the visible height scrolls, with the existing edge affordance.
- Hero note and advisory copy render identically — no color, icon, or weight distinguishes a warning from a suggestion.
- Switching the open hero re-evaluates the note and every advisory for the new hero; the panel's height does not change.

## Roles And Access

Not role-specific.

## Hero Notes

One always-shown line per hero, ≤200 characters, two sentences maximum:

| Hero          | Note                                                                                                                                                              |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Coupé         | Her slot position decides which bonus she gets, so where you place her matters more than for anyone else.                                                         |
| Flambae       | A win-more hero: he can deliver huge results once he is rolling. Whichever power you take, a loss is expensive.                                                   |
| Golem         | His value is breadth rather than any single peak. Points given to him are the least likely to be wasted.                                                          |
| Invisigal     | Starts with 11 stat points, one short of the usual 12, and reaches the same ceiling as everyone else.                                                             |
| Malevola      | Versatile: she can be built around whatever the rest of the team is short of. Her powers see few uses on a clean run.                                             |
| Phenomaman    | Fixed at rank 12 and cannot gain XP. Every call he joins burns a share of that call's XP pool.                                                                    |
| Prism         | Her value is filling empty slots rather than her own stats. The copy she places takes a share of the call's XP.                                                   |
| Punch Up      | Usually built with Vigor and Charisma maxed, which sit apart on the chart — a weak solo pick that way, but one of the strongest synergy pairs in the game.        |
| Sonar         | He alternates between two stat distributions from call to call. He always starts a shift in hybrid form, so the hybrid spread is the one you will use more often. |
| Waterboy      | Starts with 8 stat points, four short of the usual 12. His low Combat suits calls that fail when team Combat runs too high.                                       |
| Blonde Blazer | Fixed at rank 20 with 36 stat points. She accepts no allocation and has only her starting power.                                                                  |

Waterboy shows this note instead of the standard one when episode setup has him as the episode-8 hire (mutually exclusive, never both):

> Hired in episode 8 he joins at rank 1 with only his starting power, for a marginally harder endgame.

## Advisories

`K`: W = warning, S = suggestion.

| #   | K   | Predicate                                                                                             | Copy                                                                         |
| --- | --- | ----------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| 1   | W   | Roster sum of allocated Combat (`heroLevelUps[*].combat`) > 4; shown per hero with ≥1 there           | Combat is the least required stat — late missions can fail if it's too high. |
| 2   | W   | Supernova trained, any allocated `combat`/`mobility` on Flambae                                       | Supernova sets Combat/Mobility to 10 alone — those points are wasted.        |
| 3   | W   | Per stat per pair: `pairTotal > 10` and `allocatedInPair > 0`; waste = `min(excess, allocatedInPair)` | This pair's {stat} exceeds what a call can use — {waste} points wasted.      |
| 4   | W   | Raw stat (alloc-only, no power bonus) hits 10; suppressed if #3 fires on that stat                    | A stat at 10 only helps Min Max — wasted once paired.                        |
| 5   | W   | Spread Thin trained, Golem's raw stat > 8                                                             | Past 8, Spread Thin alone reaches the cap — further points wasted.           |
| 6   | W   | Wolf Pack selected                                                                                    | Wolf Pack rarely pays off — XP is usually maxed before it matters.           |
| 7   | W   | Harder Head selected                                                                                  | Harder Head needs him hurt to pay off — Squeeze In is the stronger pick.     |
| 8   | S   | Golem: 0 bonus levels, ≥1 shared bonus point unassigned                                               | Golem is a strong spare-point recipient — little is wasted on him.           |
| 9   | S   | À la Seconde trained, Coupé/Punch Up pair not yet at four stats @10                                   | With À la Seconde trained, this pair can reach four stats at 10.             |
| 10  | S   | Spread Thin trained                                                                                   | With Spread Thin trained, he can solo multi-slot calls effectively.          |

Notes: #1 excludes the 4 dispatcher points (forced, not chosen). #3 is allocation-only — silent for Phenomaman+Malevola and monster-form Sonar. #4 defers to #3 on the same stat. #9 argues nothing; it does arithmetic once À la Seconde is already trained.

## Examples

| Input                                      | Expected Output                                     |
| ------------------------------------------ | --------------------------------------------------- |
| open a hero, nothing allocated             | hero note only                                      |
| roster allocated Combat = 5                | advisory 1, every hero with ≥1 there                |
| Golem, Spread Thin trained, raw stat 8 → 9 | no advisory 5 → advisory 5                          |
| raw stat at 10, advisory 3 also true there | advisory 4 suppressed                               |
| Waterboy hired ep4 vs. ep8                 | standard note, or ep8 note — never both             |
| a hero with note + 4 true advisories       | all 5 render; panel height matches a hero with none |

## Business Rules

- A hero note is unconditional except Waterboy's, which is conditional on episode setup only, never on allocation.
- Panel order: hero note, warnings 1–7 in table order (only the true ones), suggestions 8–10 in table order (only the true ones). Order never depends on stat values, only on which are true.
- No advisory hardcodes a hero name into a threshold; the Phenomaman/Malevola and monster-form-Sonar exemptions fall out of "no allocation, no advisory" (#3/#4's gate), not an exclusion list.
- Every fact asserted in a note or advisory not already in `context/game-mechanics.md` is added there in this change (Honest Inputs).

## Edge Cases

- A stat's pair total exceeds 10 from base stats and power bonus alone, zero allocation: no advisory (3 or 4).
- A fixed-level hero (Phenomaman, Blonde Blazer) still renders its hero note and any advisory whose predicate is true from base stats plus power state (e.g. advisory 3 can fire on Phenomaman's pair if the _partner_ over-allocated).

## Invariants

- The dialog's geometry does not change with which hero is open or how many advisories apply (feature 011's existing invariant; this is the first feature to exercise it under variable content).
- No advisory or note writes planner state.
- Declaration order, not value order, decides render order within each group.

## Error Handling

No error states; a predicate that can never be satisfied under the current episode setup (e.g. advisory 9 with Coupé cut) simply never renders.

## Entry Points

- `web/utils/heroNotes.ts` — the `HERO_NOTES` and `HERO_ADVISORIES` catalogues (copy + predicates).
- `web/composables/useHeroNotes.ts` — `useHeroNotes(heroId)`, evaluating the catalogue against live planner state; follows the `useHeroDerived` precedent.
- `web/components/HeroDetailDialog.vue` — renders the panel's content from `useHeroNotes`, replacing the placeholder at `:432-447`.

## Dependencies

- Feature 011: owns the panel, its fixed height, the geometry invariant; amended here (its notes-area non-goal now points here for content) and its pair-total reserved-height bug fixed alongside.
- Feature 013: `ScrollRegion`, the fixed-height scroll and edge affordance.
- Feature 003: allocation state and budgets every predicate reads.
- Feature 012: `SPECIAL_POWER_MECHANICS`, `heroSpecialPowers`, the effective-stat/pair-total math advisories 2–5, 9–10 reuse.
- `context/game-mechanics.md`, `context/glossary.md`: amended for the sourced facts and the two new terms.

## Open Questions

## Tests

- `test/unit/hero-notes.test.ts`: every advisory predicate at its boundary, incl. #4 suppressed exactly where #3 fires on the same stat and #3 silent with nothing allocated; Waterboy's two notes stay mutually exclusive; declaration order holds regardless of which subset is true.
- `test/nuxt/hero-detail-dialog.test.ts` (extended): a fixture build renders the note + advisory set in order; panel height matches between zero and several advisories.

## Verification

`test/unit/hero-notes.test.ts` (16 cases): every advisory boundary, declaration order, Waterboy's two exclusive notes. `test/nuxt/hero-detail-dialog.test.ts` (+2) and `test/nuxt/spread-thin.test.ts` (reserved-height selector): a fixture Golem render matches the exact 5-line order; panel class is identical at zero vs. several advisories. Suite: 47 files, 377 tests, `nuxt typecheck` clean.

Live in Chrome: bullets, `text-base`, `text-muted` (`text-dimmed` is label-only per the annex); a 4-advisory Golem scrolls with the edge affordance, geometry unchanged from none. Also fixed a latent 011 bug this surfaced — see 011's Verification.

## Agent Change Rules

Before changing this feature, an agent must:

1. Read this feature document.
2. Identify which documented behavior or invariant is affected.
3. Confirm the Status is `Approved` (or later), or ask the user to approve the document first.
4. Add or update tests for the changed behavior.
5. Update this document in the same change if the intended behavior changes.
6. Update `project-summary.md` if the feature summary or status changes.
