# Feature: Planner mechanics

Retro-documented (brownfield): written from the shipped code and observed behavior.

## Status

Active

## Task Weight

Medium

## Purpose

The heart of the app: controls that let a player allocate the budgets the game grants — level-up points, power trainings, flight trainings, bonus levels — under the same rules, with the roster shaped by their story choices. The card grid shows the resulting effective stats, arranged by synergy pairs.

## Inputs

| Input           | Type                                   | Source                | Constraints                                        |
| --------------- | -------------------------------------- | --------------------- | -------------------------------------------------- |
| episode choices | `ep3Cut`, `ep4Hire`, `showEp8Recruits` | Story Setup drawer    | coupe\|sonar; phenomaman\|waterboy; boolean        |
| stat +/− clicks | UI events                              | HeroCard rows         | budget- and cap-guarded (silently no-op past them) |
| power toggles   | UI events                              | HeroCard icon buttons | reveal starting first; one trainable per hero      |
| flight toggles  | UI events                              | HeroCard plane button | trainable heroes only                              |
| bonus level +   | UI event                               | HeroCard              | shared pool of 4                                   |
| reset           | UI event                               | HeroCard rotate icon  | per-hero, not for fixed-level heroes               |
| budget reset    | UI event                               | Story Setup drawer    | per budget, or all three at once                   |

## Outputs And Side Effects

| Output / Side Effect | Type            | Description                                                                  |
| -------------------- | --------------- | ---------------------------------------------------------------------------- |
| planner state        | `useState` refs | the eight keys listed under Invariants — exactly what feature 001 serializes |
| effective stats      | rendered        | starting + allocations + special-power bonus per stat                        |
| roster layout        | rendered        | synergy-pair columns with pair markers; optional episode-8 recruit row       |

## Scope And Non-Goals

In scope:

- Level-ups, bonus levels, power training, special powers, flight training, episode setup, per-hero reset, budget resets, and the overview layout.
- The surfaces those controls live on: the Story Setup drawer, the top-bar budget readout, and the mobile action bar.

Non-goals:

- Synergy _levels_ (1–3) and success-chance math — pairs are displayed, levels are not modeled.
- The "Synergy pairs" and "Mission simulator" tabs — placeholders today (see Open Questions).
- Persistence and sharing of this state — feature 001.

## User / System Behavior

**Story Setup drawer.** Episode setup and budget management live in a right-side slideover opened from a control present at every width. Every control writes through immediately — no commit step, closing discards nothing. Its open state is ephemeral: not kept across a reload or a shared link, not in the URL.

**Budget readout.** The three shared budgets render twice: in the top bar as a **readout** (value and label, no controls, hidden below `md`), and in the drawer's Training budget section as the **management** surface — a row per budget with its own reset, shown only while that budget has something to reset.

**Reset all trainings.** One unconfirmed action in the drawer's footer clears all three shared budgets, equivalent to each budget's own reset in turn; everything it clears is re-allocable by clicking. Per-hero level-up allocations, powers and special powers stay — those are the per-hero reset's business.

**Episode setup.** Default: Sonar cut, Waterboy hired, episode-8 recruits hidden. The cut hero leaves the roster; the non-hired episode-4 option and Blonde Blazer appear only with "episode 8 recruits" shown. Changing a choice wipes the affected heroes' allocations, powers and flight (watchers on the choice).

**Level-ups.** Each hero can allocate `MAX_LEVEL_UPS` (9) points, +1 per bonus level; a stat never exceeds 10 (starting + allocated). Bonus levels: max 4 per hero from a _shared_ pool of 4 team-wide. Fixed-level heroes (Phenomaman Lv. 12, Blonde Blazer Lv. 20) accept no allocation, bonus, or reset.

**Displayed level.** A hero's level is `1 + points spent`. A bonus level raises the cap and hands the hero a point to spend; it is not itself a level, so the readout moves only once that point is allocated. The card and the detail dialog show the same number.

**Powers.** The starting power must be revealed before a trainable can be selected; switching to the other trainable is free; selecting where none was consumes one of the team-wide `MAX_POWER_TRAININGS` (7). Un-revealing the starting power clears the trainable and any special power. Episode-8 recruits cannot train (Blonde Blazer has no trainable powers at all).

**Special powers** (display-only stat effects): Flambae's Supernova (requires trainable-2 selected) raises Combat and Mobility to 10; Coupé's En Pointe cycles off → +Combat → +Mobility, +1 normally, +3 with À la Seconde. Sonar's card offers a monster-form toggle that swaps Combat↔Intellect and Vigor↔Charisma in the display only — never stored, never serialized.

**Flight.** Flight School is its own training track; its toggle sits in the card's header row, not in the power strip (Hero Power Training only). Coupe/Flambae/Sonar toggle flight from a shared pool of `MAX_FLIGHT_TRAININGS` (2). Phenomaman flies unless Heavily Medicated (trainable-1) is selected — then the plane glyph is absent, not shown off, because the power removes the ability. Blonde Blazer always flies; neither consumes the pool. Episode-8 recruits have no training left, so a flier among them flies permanently.

**Reset.** The per-hero reset clears that hero's allocations, bonus levels, powers, special powers, and flight.

## Roles And Access

Not role-specific.

## Examples

| Input                                            | Expected Output                                    |
| ------------------------------------------------ | -------------------------------------------------- |
| allocate 9 points to a hero, click +             | no-op (budget exhausted)                           |
| +1 bonus level, then allocate a 10th point       | accepted                                           |
| +1 bonus level, allocate nothing                 | level unchanged; a 10th point is now allocatable   |
| 4 bonus levels on one hero, + on another         | no-op (shared pool of 4 is empty)                  |
| stat at 10 (starting + allocated), click +       | no-op (`MAX_STAT_VALUE`)                           |
| select trainable on an unrevealed hero           | no-op (reveal gates training)                      |
| 7 heroes trained, select an 8th hero's trainable | no-op (`MAX_POWER_TRAININGS`)                      |
| switch a trained hero's trainable 1 → 2          | accepted, budget unchanged                         |
| un-reveal a trained hero's starting power        | trainable and special power cleared too            |
| toggle Supernova without trainable-2             | no-op                                              |
| Supernova on Flambae (4 combat, +2 allocated)    | Combat shows 10 (+4 special bonus, never past 10)  |
| train flight on coupe and flambae, then sonar    | sonar's toggle no-ops (`MAX_FLIGHT_TRAININGS` = 2) |
| select Heavily Medicated on Phenomaman           | leaves the flying set, plane glyph disappears      |
| change ep3 cut sonar → coupe                     | Coupé's state wiped, Sonar's kept; column updates  |
| change ep4 hire waterboy → phenomaman            | Waterboy's state wiped                             |
| `Reset all trainings` at 2/7 · 0/2 · 2/4         | all three read 0; per-hero allocations unchanged   |
| open Story Setup, reload the page                | drawer closed, episode choices preserved           |
| show episode-8 recruits at one column wide       | recruits under their heading, pairs stay grouped   |

## Business Rules

- All budget checks are guard clauses: an over-budget action silently does nothing (buttons also disable in the UI, but state guards are authoritative).
- Budgets: 9 level-up points/hero (+bonus), 4 bonus levels shared and per-hero, 7 power trainings shared, 2 flight trainings shared, stat cap 10.
- Displayed level is `1 + points spent` — never `+ bonus levels`, or the level jumps ahead of the allocation that earned it and the card disagrees with the dialog.
- The card's power strip holds at most **four** chips — `sonar form? + starting + upgrades(≤2) + special?` — and a fifth breaks every card's alignment (annex §13, Card body). Adding a `SPECIAL_POWER_MECHANICS` entry for Sonar, or a second form toggle, must first move something out of the strip, the way flight was moved.
- Effective displayed stat = `startingStats + allocations + specialPowerBonus`, per stat.
- `Reset all trainings` is exactly the union of the three per-budget resets; a fourth shared budget must be added there too, or it silently under-resets.
- A per-budget reset is offered only while that budget is non-zero.
- Overview lays heroes out as synergy-pair columns (base pairs + the one conditional pair for the current choices), each pair marked between its two cards and spaced closer than to the next pair — the marker carries the pairing once the grid stacks to one column. Episode-8 recruits render in their own row beneath, under an `Episode 8 recruits` heading.

## Edge Cases

- `useHeroPlanner` is a per-app singleton (cached on `nuxtApp`); a second instance would register the watchers twice and double every reset.
- Deserialization (feature 001) sets episode choices first and waits a tick so these watchers do not wipe the restored hero state.
- Coupé's En Pointe applies +1 even untrained, +3 only with À la Seconde.

## Invariants

- The `useState` keys (`ep3Cut`, `ep4Hire`, `showEp8Recruits`, `heroLevelUps`, `heroBonusLevels`, `heroPowers`, `heroSpecialPowers`, `heroFlights`) are feature 001's serialization source — renaming or reshaping them is a change to the protected build format.
- A cut or non-hired hero holds no planner state (watchers enforce on change; deserialization respects it by ordering).
- Special-power bonuses are computed, never written into `heroLevelUps`; allocations never exceed budgets even transiently.

## Error Handling

- No error states: every invalid action is a silent no-op with the corresponding control disabled in the UI.

## Entry Points

- `web/composables/`: `useHeroPlanner.ts` (singleton aggregator, also `resetHero`) over the four rule domains — `useHeroEpisodeSetup.ts`, `useHeroLevelUp.ts`, `useHeroPowerTraining.ts`, `useHeroFlightTraining.ts`.
- `web/components/HeroCard.vue` (per-hero controls), `web/pages/index.vue` (roster layout and tabs).
- `web/components/_shared/`: `StorySetupDrawer.vue` (episode fields, budget rows, `Reset all trainings`), `BudgetCounters.vue` (the top-bar readout).
- `web/app.vue`: the shell placing the readout, the drawer trigger and the mobile action bar.

## Dependencies

- Feature 002 (hero data): every constant and dataset these rules run on.
- Feature 001 (build persistence): serializes exactly this state.

## Open Questions

Deliberate long-horizon items kept past approval (brownfield exception, `workflows/brownfield.md`):

- The "Synergy pairs" and "Mission simulator" tabs are empty placeholders — planned capabilities, each expected to arrive as its own feature document.
- Synergy levels (5%/level success math) are not modeled; adopt only if the planner ever computes success chances.

## Tests

- Honest gap: no automated tests. Wanted first: unit tests for the budget guards (level-up cap with/without bonus, shared pools, power-training gating and free switching) via the composables with seeded state. Until then the live browser walk covers the card controls.

## Verification

Walked live on `feature/003-story-setup-drawer` (2026-08-25), in Chrome and headless against the dev server, at 1600 / 1280 / 1024 / 768 / 390 / 320:

- No horizontal overflow at any width; all ten hero cards report one identical box (320 × 208 at `md`+, strip 108 × 24) and nothing reflows on click through reveal → trainable-2 → Supernova; the flight glyph is present for exactly the `HERO_FLIGHT` five and a medicated Phenomaman keeps its slot without the glyph.
- `+1 bonus` left the level at 2 and only the allocation moved it to 3, card and dialog agreeing. `Reset all trainings` took `7/7 · 0/2 · 4/4` to `0/7 · 0/2 · 0/4` in one click, then disabled itself.
- Pair markers sit between their cards at every tier; the recruit heading is `heading level=2` in the a11y tree, the bands `decorative`. Dialog, selects and switch are labelled. Known gap, not introduced here: `HeroCard`'s steppers, per-hero reset and bonus `+` are unnamed.

Rules were retro-documented from the four composables, HeroCard and index.vue, cross-checked against `context/game-mechanics.md`; flight, episode-cut resets and effective-stat display were exercised in the feature 001 walk (2026-08-21). oxlint, vue-tsc and vitest pass. Pixel-level measurements of the tier ladder, chrome and bands live in annex §13–14, which the walk confirmed.

## Agent Change Rules

Before changing this feature, an agent must:

1. Read this feature document.
2. Identify which documented behavior or invariant is affected.
3. Confirm the Status is `Approved` (or later), or ask the user to approve the document first.
4. Add or update tests for the changed behavior.
5. Update this document in the same change if the intended behavior changes.
6. Update `project-summary.md` if the feature summary or status changes.
