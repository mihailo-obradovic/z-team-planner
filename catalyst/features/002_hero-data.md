# Feature: Hero data and domain model

Retro-documented (brownfield): written from the shipped code, verified against `context/game-mechanics.md`.

## Status

Active

## Task Weight

Medium

## Purpose

Everything the planner computes stands on the game data transcribed from Dispatch: hero roster, starting stats, powers, flight capabilities, and synergy pairs. This feature is that dataset and its type system — the single vocabulary every other feature consumes. If this data is wrong, the planner is confidently wrong everywhere.

## Inputs

| Input                       | Type      | Source                    | Constraints                         |
| --------------------------- | --------- | ------------------------- | ----------------------------------- |
| `GET /api/heroes`           | HTTP GET  | Nitro endpoint, no params | static; no auth, no query           |
| `context/game-mechanics.md` | reference | the game (upstream truth) | data is transcribed, never invented |

## Outputs And Side Effects

| Output / Side Effect | Type                           | Description                                                             |
| -------------------- | ------------------------------ | ----------------------------------------------------------------------- |
| hero list            | `Hero[]` JSON                  | 11 heroes: id, display name, starting stats (5 stats each)              |
| domain constants     | exports of `web/types/hero.ts` | powers, flight, synergy, episode options, and every budget/cap constant |

## Scope And Non-Goals

In scope:

- The `HeroId` union (11 ids) and `Hero`/`HeroStats` shapes; `STAT_NAMES` order (combat, intellect, vigor, charisma, mobility).
- Starting stats served by `server/api/heroes.get.ts`.
- `HERO_POWERS`: exactly 3 powers per hero (starting + two trainable options; some trainables override the starting power; Blonde Blazer's two trainable slots are deliberately empty).
- `SPECIAL_POWER_MECHANICS` (Flambae supernova, Coupé en-pointe), `HERO_FLIGHT` + `HERO_FLIGHT_CAPABILITY` (innate / conditional-power / trainable), `FLIGHT_SCHOOL_HEROES`.
- `BASE_SYNERGY_PAIRS` (4) and `CONDITIONAL_SYNERGY_PAIRS` (4, keyed `<ep3Cut>-cut-<ep4Hire>-hired`).
- Episode options (`EP3_CUT_OPTIONS`: coupe/sonar; `EP4_HIRE_OPTIONS`: phenomaman/waterboy), `FIXED_LEVEL_HEROES` (phenomaman 12, blonde-blazer 20).
- Budget constants: `MAX_STAT_VALUE` 10, `MAX_LEVEL_UPS` 9, `MAX_BONUS_POINTS` 4, `MAX_BONUS_LEVEL_PER_HERO` 4, `MAX_POWER_TRAININGS` 7, `MAX_FLIGHT_TRAININGS` 2.

Non-goals:

- How the data is _used_ (budgets enforced, visibility, toggles) — that is feature 003.
- Dispatching/scoring/XP mechanics — reference-only background, deliberately not modeled (product non-goal).
- Persisting or editing this data at runtime; it ships with the app.

## User / System Behavior

- `GET /api/heroes` always returns the same 11 heroes with the same stats; the client fetches once (`useNuxtData('heroes')`, fetched in `app.vue`).
- All other domain data is imported directly from `web/types/hero.ts` — no request involved.

## Roles And Access

Not role-specific.

## Examples

| Input                                                   | Expected Output                                                           | Notes                                          |
| ------------------------------------------------------- | ------------------------------------------------------------------------- | ---------------------------------------------- |
| `GET /api/heroes`                                       | 11 heroes; e.g. coupe → 4/3/1/1/3, blonde-blazer → 8/7/8/6/7 (C/I/V/Ch/M) | full table matches `context/game-mechanics.md` |
| `HERO_POWERS['blonde-blazer']`                          | Radiant Light + two empty trainable slots                                 | she has only the starting power                |
| `CONDITIONAL_SYNERGY_PAIRS['coupe-cut-waterboy-hired']` | punch-up + waterboy                                                       | the cut hero's partner gains the new hire      |
| `HERO_FLIGHT_CAPABILITY['phenomaman']`                  | conditional-power on trainable-1, inverted                                | Heavily Medicated _removes_ flight             |

## Business Rules

- Data is transcribed from `context/game-mechanics.md`; the game is the upstream source of truth. Never change data from memory — when in-game observation disagrees, the reference is corrected first, the data with it.
- Every hero has exactly 3 power slots; only one trainable can ever be selected (enforced by feature 003, encoded in the types here).
- Synergy pairing: 4 base pairs always; exactly one conditional pair per (ep3Cut, ep4Hire) combination.

## Edge Cases

- Blonde Blazer's empty trainable slots: consumers must treat a power with an empty `name` as absent (feature 003 does).
- `sonar`'s flight is trainable but only visually active when transformed — a UI concern, noted in the capability comment, not modeled as state.

## Invariants

- **Protected area — hero ids and game data**: `HeroId` values are persisted in saved/shared builds (feature 001); renaming or removing an id breaks builds in the wild. Stats, powers, and pairs change only to track the game or its reference.
- `STAT_NAMES` order is load-bearing: build serialization stores stats as arrays in this order (feature 001).
- The heroes endpoint is static and side-effect-free.

## Error Handling

- None to speak of: the endpoint cannot fail on input (it takes none), and the constants are compile-time.

## Entry Points

- `server/api/heroes.get.ts`: the roster + starting stats.
- `web/types/hero.ts`: every other domain constant and type.

## Dependencies

- `context/game-mechanics.md`: the reference this data mirrors.

## Open Questions

Deliberate long-horizon items kept past approval (brownfield exception, `workflows/brownfield.md`):

- `MAX_LEVEL_UPS = 9` and `MAX_POWER_TRAININGS = 7` encode playthrough-derived budgets the reference states loosely ("9 bonus points … for each level up" is ambiguous; 7 trainings is observed, not written). If in-game observation contradicts either, correct the reference first, then the constant.

## Tests

- Honest gap: no automated test pins the served stats to the reference table. Wanted: a unit test comparing `server/api/heroes.get.ts` data against the documented table (the check exists as a one-off script run during this documentation pass).

## Verification

Retro-documented from code; all 11 heroes' starting stats programmatically compared against the `context/game-mechanics.md` table — exact match, no extra ids (2026-08-21). Power names/descriptions and synergy pairs spot-checked against the reference's Hero Training and Synergy sections. oxlint and vue-tsc pass.

## Agent Change Rules

Before changing this feature, an agent must:

1. Read this feature document.
2. Identify which documented behavior or invariant is affected.
3. Confirm the Status is `Approved` (or later), or ask the user to approve the document first.
4. Add or update tests for the changed behavior.
5. Update this document in the same change if the intended behavior changes.
6. Update `project-summary.md` if the feature summary or status changes.
