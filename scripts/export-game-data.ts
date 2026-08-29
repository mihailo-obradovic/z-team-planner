import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import {
  DEFAULT_EP3_CUT,
  DEFAULT_EP4_HIRE,
  EP3_CUT_OPTIONS,
  EP4_HIRE_OPTIONS,
  EP8_ALWAYS_RECRUITED,
  FIXED_LEVEL_HEROES,
  FLIGHT_SCHOOL_HEROES,
  HERO_POWERS,
  HEROES,
  MAX_BONUS_LEVEL_PER_HERO,
  MAX_BONUS_POINTS,
  MAX_FLIGHT_TRAININGS,
  MAX_LEVEL_UPS,
  MAX_POWER_TRAININGS,
  MAX_STAT_VALUE,
  SPECIAL_POWER_MECHANICS,
  STAT_NAMES
} from '../web/types/hero.ts';

import type { HeroId } from '../web/types/hero.ts';

/**
 * Derives `shared/game-data.json` — the fixture the API validates saved builds against.
 *
 * Game data has one source, `web/types/hero.ts` (feature 005, Invariants): the server never
 * holds a hand copy. `test/unit/game-data.test.ts` fails whenever the committed fixture and a
 * fresh export disagree, so the two cannot drift apart unnoticed.
 */

// * Runs as `node scripts/export-game-data.ts` — Node 26 strips the types itself, so this needs no bundler and no dependency. That mode is what the explicit `.ts` import extensions above are for.

export type GameData = {
  stat_names: readonly string[];
  max_stat_value: number;
  max_level_ups: number;
  max_bonus_points: number;
  max_bonus_level_per_hero: number;
  max_power_trainings: number;
  max_flight_trainings: number;
  ep3_cut_options: readonly HeroId[];
  ep4_hire_options: readonly HeroId[];
  always_recruited: readonly HeroId[];
  default_ep3_cut: HeroId;
  default_ep4_hire: HeroId;
  fixed_level_heroes: HeroId[];
  flight_school_heroes: readonly HeroId[];
  special_powers: Record<string, { max: number; requires_trainable?: number }>;
  heroes: Record<
    HeroId,
    { starting_stats: number[]; trainable_powers: number }
  >;
};

export function buildGameData(): GameData {
  const heroes = Object.fromEntries(
    HEROES.map((hero) => [
      hero.id,
      {
        starting_stats: STAT_NAMES.map((stat) => hero.startingStats[stat]),
        // * A trainable slot counts only when it is a real power: Blonde Blazer's two are empty placeholders that keep her power set the same shape as everyone else's.
        trainable_powers: HERO_POWERS[hero.id]
          .slice(1)
          .filter((power) => power.name !== '').length
      }
    ])
  ) as GameData['heroes'];

  return {
    stat_names: STAT_NAMES,
    max_stat_value: MAX_STAT_VALUE,
    max_level_ups: MAX_LEVEL_UPS,
    max_bonus_points: MAX_BONUS_POINTS,
    max_bonus_level_per_hero: MAX_BONUS_LEVEL_PER_HERO,
    max_power_trainings: MAX_POWER_TRAININGS,
    max_flight_trainings: MAX_FLIGHT_TRAININGS,
    ep3_cut_options: EP3_CUT_OPTIONS,
    ep4_hire_options: EP4_HIRE_OPTIONS,
    always_recruited: EP8_ALWAYS_RECRUITED,
    default_ep3_cut: DEFAULT_EP3_CUT,
    default_ep4_hire: DEFAULT_EP4_HIRE,
    fixed_level_heroes: Object.keys(FIXED_LEVEL_HEROES) as HeroId[],
    flight_school_heroes: FLIGHT_SCHOOL_HEROES,
    special_powers: {
      // * Supernova is a single on/off state and needs its upgrade power trained; En Pointe cycles off / +combat / +mobility and needs nothing.
      flambae: {
        max: 1,
        requires_trainable: Number(
          SPECIAL_POWER_MECHANICS.flambae.requiredPower.slice(-1)
        )
      },
      coupe: { max: 2 }
    },
    heroes
  };
}

// * Only when run directly: importing this module (the test does) must not write a file.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  writeFileSync(
    'shared/game-data.json',
    JSON.stringify(buildGameData(), null, 2) + '\n'
  );
}
