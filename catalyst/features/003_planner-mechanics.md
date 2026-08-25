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

| Output / Side Effect | Type            | Description                                                                                                                                |
| -------------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| planner state        | `useState` refs | `heroLevelUps`, `heroBonusLevels`, `heroPowers`, `heroSpecialPowers`, `heroFlights`, episode keys — the exact state feature 001 serializes |
| effective stats      | rendered        | starting + allocations + special-power bonus per stat                                                                                      |
| roster layout        | rendered        | synergy-pair columns, each marked between its two cards; optional episode-8 recruit row under its own heading                              |

## Scope And Non-Goals

In scope:

- Level-ups, bonus levels, power training, special powers, flight training, episode setup, per-hero reset, budget resets, and the overview layout.
- The surfaces those controls live on: the Story Setup drawer, the top-bar budget readout, and the mobile action bar.

Non-goals:

- Synergy _levels_ (1–3) and success-chance math — pairs are displayed, levels are not modeled.
- The "Synergy pairs" and "Mission simulator" tabs — placeholders today (see Open Questions).
- Persistence and sharing of this state — feature 001.

## User / System Behavior

**Story Setup drawer.** Episode setup and budget management live in a right-side slideover, not in the top bar, opened by a control present at every viewport width. Every control inside writes through immediately, so there is no commit step and closing discards nothing. Its open state is ephemeral: it survives neither a reload nor a shared-build link, and it is not addressable by URL.

**Budget readout.** The three shared budgets render twice, in two roles. In the top bar they are a **readout** — value and label, no controls, hidden below `md` where there is no room. In the drawer's Training budget section they are the **management** surface: a row per budget carrying its own reset, shown only while that budget has something to reset.

**Reset all trainings.** A single action in the drawer's footer clears all three shared budgets at once, equivalent to invoking each budget's own reset in turn. It is unconfirmed: it sits behind a deliberate drawer open, and everything it clears is re-allocable by clicking. Per-hero level-up allocations, powers and special powers are untouched — those remain the per-hero reset's business.

**Episode setup.** Default: Sonar cut, Waterboy hired, episode-8 recruits hidden. The cut hero disappears from the roster; the non-hired episode-4 option and Blonde Blazer appear only when "episode 8 recruits" is shown. Changing a choice wipes the affected heroes' allocations, powers, and flight — watchers fire on the choice change.

**Level-ups.** Each hero can allocate `MAX_LEVEL_UPS` (9) points, +1 per bonus level; a stat never exceeds 10 (starting + allocated). Bonus levels: max 4 per hero from a _shared_ pool of 4 team-wide. Fixed-level heroes (Phenomaman Lv. 12, Blonde Blazer Lv. 20) accept no allocation, bonus, or reset.

**Displayed level.** A hero's level is `1 + points spent`. A bonus level raises the cap and hands the hero a point to spend; it is not itself a level, so the readout moves only once that point is allocated. The card and the detail dialog show the same number.

**Powers.** The starting power must be revealed before a trainable can be selected; selecting the other trainable switches (no extra budget); selecting where none was consumes one of the team-wide `MAX_POWER_TRAININGS` (7). Un-revealing the starting power also clears the trainable and any special power. Episode-8 recruits cannot train (Blonde Blazer also has no trainable powers at all).

**Special powers** (display-only stat effects): Flambae's Supernova (requires trainable-2 selected) raises Combat and Mobility to 10; Coupé's En Pointe cycles off → +Combat → +Mobility, +1 normally, +3 with À la Seconde. Sonar's card offers a monster-form toggle that swaps Combat↔Intellect and Vigor↔Charisma in the display only — never stored, never serialized.

**Flight.** Coupe/Flambae/Sonar toggle flight from a shared pool of `MAX_FLIGHT_TRAININGS` (2). Phenomaman flies unless Heavily Medicated (trainable-1) is selected; Blonde Blazer always flies; neither consumes the pool.

**Reset.** The per-hero reset clears that hero's allocations, bonus levels, powers, special powers, and flight.

## Roles And Access

Not role-specific.

## Examples

| Input                                                        | Expected Output                                           | Notes                           |
| ------------------------------------------------------------ | --------------------------------------------------------- | ------------------------------- |
| allocate 9 points to a hero, click +                         | no-op                                                     | budget exhausted                |
| +1 bonus level, then allocate a 10th point                   | accepted                                                  | bonus raises the per-hero cap   |
| +1 bonus level, allocate nothing                             | level unchanged; a 10th point is now allocatable          | bonus is a cap, not a level     |
| 4 bonus levels on one hero, + on another                     | no-op                                                     | shared pool of 4 is empty       |
| stat at 10 (starting + allocated), click +                   | no-op                                                     | `MAX_STAT_VALUE`                |
| select trainable on an unrevealed hero                       | no-op                                                     | reveal gates training           |
| 7 heroes trained, select an 8th hero's trainable             | no-op                                                     | `MAX_POWER_TRAININGS`           |
| switch a trained hero's trainable 1 → 2                      | accepted, budget unchanged                                | switching is free               |
| un-reveal a trained hero's starting power                    | trainable and special power cleared too                   |                                 |
| toggle Supernova without À la Seconde… without trainable-2   | no-op                                                     | requires trainable-2 selected   |
| Supernova on Flambae (4 combat, +2 allocated)                | Combat shows 10 (+4 special bonus)                        | bonus tops up to 10, never past |
| train flight on coupe and flambae, then sonar                | sonar's toggle no-ops                                     | `MAX_FLIGHT_TRAININGS` = 2      |
| select Heavily Medicated on Phenomaman                       | Phenomaman leaves the flying set                          | inverted conditional flight     |
| change ep3 cut sonar → coupe                                 | Coupé's state wiped, Sonar's kept; synergy column updates | watcher-driven reset            |
| change ep4 hire waterboy → phenomaman                        | Waterboy's state wiped                                    | non-hired option reset          |
| `Reset all trainings` with 2/7 powers, 0/2 flight, 2/4 bonus | all three read 0; hero level-up allocations unchanged     | union of the three resets       |
| open Story Setup, reload the page                            | drawer closed, episode choices preserved                  | open state is ephemeral         |
| show episode-8 recruits at one column wide                   | recruits appear under their heading, pairs stay grouped   | marker + spacing, not the grid  |

## Business Rules

- All budget checks are guard clauses: an over-budget action silently does nothing (buttons also disable in the UI, but state guards are authoritative).
- Budgets: 9 level-up points/hero (+bonus), 4 bonus levels shared and per-hero, 7 power trainings shared, 2 flight trainings shared, stat cap 10.
- Displayed level is `1 + points spent` — never `+ bonus levels`, or the level jumps ahead of the allocation that earned it and the card disagrees with the dialog.
- Effective displayed stat = `startingStats + allocations + specialPowerBonus`, per stat.
- `Reset all trainings` is exactly the union of the three per-budget resets; a fourth shared budget must be added there too, or it silently under-resets.
- A per-budget reset is offered only while that budget is non-zero.
- Overview lays heroes out as synergy-pair columns (base pairs + the one conditional pair for the current choices); episode-8 recruits render in their own row beneath, under a `Episode 8 recruits` heading.
- A pair is marked between its two cards, and its two cards sit closer to each other than to the next pair — the columns are what carries the pairing, and a column is invisible once the grid stacks into a single phone-width list.

## Edge Cases

- `useHeroPlanner` is a per-app singleton (cached on `nuxtApp`) — one instance shared by every component; duplicate watcher registration would double resets.
- Deserialization (feature 001) sets episode choices first and waits a tick so these same watchers do not wipe the restored hero state afterwards.
- Coupé's En Pointe cycle is reachable whenever her card shows the toggle; the +bonus applies with base power (+1) even untrained, +3 only with À la Seconde.

## Invariants

- The `useState` keys (`ep3Cut`, `ep4Hire`, `showEp8Recruits`, `heroLevelUps`, `heroBonusLevels`, `heroPowers`, `heroSpecialPowers`, `heroFlights`) are feature 001's serialization source — renaming or reshaping them is a change to the protected build format.
- A cut or non-hired hero holds no planner state (watchers enforce on change; deserialization respects it by ordering).
- Special-power bonuses are computed, never written into `heroLevelUps`; allocations never exceed budgets even transiently.

## Error Handling

- No error states: every invalid action is a silent no-op with the corresponding control disabled in the UI.

## Entry Points

- `app/composables/`: `useHeroPlanner.ts` (singleton aggregator, also `resetHero`) over the four rule domains — `useHeroEpisodeSetup.ts`, `useHeroLevelUp.ts`, `useHeroPowerTraining.ts`, `useHeroFlightTraining.ts`.
- `app/components/HeroCard.vue` (per-hero controls), `app/pages/index.vue` (roster layout and tabs).
- `app/components/_shared/`: `StorySetupDrawer.vue` (episode fields, budget rows, `Reset all trainings`), `BudgetCounters.vue` (the top-bar readout).
- `app/app.vue`: the shell placing the readout, the drawer trigger and the mobile action bar.

## Dependencies

- Feature 002 (hero data): every constant and dataset these rules run on.
- Feature 001 (build persistence): serializes exactly this state.

## Open Questions

Deliberate long-horizon items kept past approval (brownfield exception, `workflows/brownfield.md`):

- The "Synergy pairs" and "Mission simulator" tabs are empty placeholders — planned capabilities, each expected to arrive as its own feature document.
- Synergy levels (5%/level success math) are not modeled; adopt only if the planner ever computes success chances.

## Tests

- Honest gap: no automated tests. Wanted first: unit tests for the budget guards (level-up cap with/without bonus, shared pools, power-training gating and free switching) — they encode the game rules and are pure enough to test via the composables with seeded state.
- Until then the card controls are covered by the live browser walk, per the stack's testing rule.

## Verification

Walked live in Chrome on `feature/003-story-setup-drawer` (2026-08-25), at 1600, 1440, 1024, 768, 390 and 320:

- **Tier ladder** (annex §13): each tier drops what the ladder says and nothing else; at 320 `scrollWidth === clientWidth` and no label is clipped — the tab list scrolls inside itself.
- **Drawer**: `Reset all trainings` took `7/7 · 0/2 · 4/4` → `0/7 · 0/2 · 0/4` in one click, then disabled itself and the per-row resets disappeared; a per-budget reset moved the readout with it, and gating held — at `7/7 · 0/2 · 4/4` exactly two glyphs rendered.
- **Roster grouping**: each pair carries its marker between its two cards at every tier, and the recruit heading reaches the a11y tree as `heading level=2` while the bands themselves stay out of it (`decorative`). At one column wide the pair still reads tighter than the gap to the next pair — the defect this closed.
- **Accessible names**: dialog, selects and switch labelled, base-tier glyph 44 × 44 (§14.2); `TooltipButton` was unnamed and now passes its text through `IconButton`'s `label`. Known gap, not introduced here: `HeroCard`'s steppers, per-hero reset and bonus `+` are still unnamed — one line each.

A second walk followed the minor-fix pass on the same branch (2026-08-25, headless Chromium against the dev server), re-measuring what the fixes touched:

- **Header**: every action is 32 × 32 at `xl`, `lg` and `md`, the base-tier glyph 44 × 44. The Story Setup trigger paints gold (`rgb(233,190,98)`) instead of the secondary teal that measured 1.29:1 on the chrome (annex §14.1). The ladder still holds at 1600 / 1280 / 1024 / 768 / 390 / 320, and `scrollWidth === clientWidth` at every one of them.
- **Tabs**: the Mission simulator's `Concept` chip is gone. The tab list now fits from 360 up; 320 is the only width where it still overflows (353 vs 320) and scrolls inside itself, which is what `overflow-x-auto` plus `shrink-0` is there for.
- **Hero card**: the portrait column is pinned to 112px and the toggle strip wraps inside it, so every card reports the same `112 / 172` columns at 1600 and at 320 — Flambae and Coupé included, where the strip now takes two rows (60px) instead of widening the card. The bonus `+` and the stat `+` steppers share a right edge to the pixel.
- **Level readout**: `+1 bonus` left the level at 2 and only the allocation moved it to 3; the detail dialog agreed.
- **Close buttons**: the drawer's and the dialog's `×` centre on the plate band (both at 21 against the title's 21, in a band spanning 2 → 42) and end on the title's own rail, at `sm`-and-up and base widths alike.

Rules were retro-documented from the four composables, HeroCard and index.vue, cross-checked against `context/game-mechanics.md` (Hero Training, Stats, Synergy); flight, episode-cut resets and effective-stat display were exercised live in the feature 001 walk (2026-08-21). oxlint, vue-tsc and vitest pass.

## Agent Change Rules

Before changing this feature, an agent must:

1. Read this feature document.
2. Identify which documented behavior or invariant is affected.
3. Confirm the Status is `Approved` (or later), or ask the user to approve the document first.
4. Add or update tests for the changed behavior.
5. Update this document in the same change if the intended behavior changes.
6. Update `project-summary.md` if the feature summary or status changes.
