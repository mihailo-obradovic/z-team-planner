import { DEFAULT_EP3_CUT, DEFAULT_EP4_HIRE, STAT_NAMES } from '@/types/hero';

import type { HeroId, HeroPowerSelection, HeroStats } from '@/types/hero';
import type { PlannerState } from '@/composables/usePlannerState';
import type { SerializedBuild } from '@/types/build';

// * The build document format — feature 001's protected area, and the only place it is written or read.
// * Every value that still equals its default is omitted, which is what keeps a share URL short: an untouched planner serialises to `{ v: 1 }`.

export function serializeBuild(state: PlannerState): SerializedBuild {
  const build: SerializedBuild = { v: 1 };

  if (state.ep3Cut.value !== DEFAULT_EP3_CUT) {
    build.ec = state.ep3Cut.value;
  }

  if (state.ep4Hire.value !== DEFAULT_EP4_HIRE) {
    build.eh = state.ep4Hire.value;
  }

  if (state.showEp8Recruits.value) {
    build.e8 = 1;
  }

  const lu: Record<string, number[]> = {};

  for (const [id, stats] of Object.entries(state.heroLevelUps.value)) {
    if (stats && !isZeroStats(stats)) {
      lu[id] = statsToArray(stats);
    }
  }

  if (Object.keys(lu).length > 0) {
    build.lu = lu;
  }

  const bl: Record<string, number> = {};

  for (const [id, level] of Object.entries(state.heroBonusLevels.value)) {
    if (level && level > 0) {
      bl[id] = level;
    }
  }

  if (Object.keys(bl).length > 0) {
    build.bl = bl;
  }

  const pw: Record<string, [number, number]> = {};

  for (const [id, power] of Object.entries(state.heroPowers.value)) {
    if (power && (power.startingRevealed || power.trainableSelected > 0)) {
      pw[id] = [power.startingRevealed ? 1 : 0, power.trainableSelected];
    }
  }

  if (Object.keys(pw).length > 0) {
    build.pw = pw;
  }

  const sp: Record<string, number> = {};

  for (const [id, value] of Object.entries(state.heroSpecialPowers.value)) {
    if (value && value > 0) {
      sp[id] = value;
    }
  }

  if (Object.keys(sp).length > 0) {
    build.sp = sp;
  }

  const fl: string[] = [];

  for (const [id, flying] of Object.entries(state.heroFlights.value)) {
    if (flying) {
      fl.push(id);
    }
  }

  if (fl.length > 0) {
    build.fl = fl;
  }

  return build;
}

// ! Episode choices are written first and the rest only after `nextTick()`: the sub-composables watch those flags and reset allocations for cut and non-hired heroes on the next tick, which would otherwise wipe the values this function has just loaded.
export async function deserializeBuild(
  build: SerializedBuild,
  state: PlannerState
): Promise<void> {
  state.ep3Cut.value = build.ec ?? DEFAULT_EP3_CUT;
  state.ep4Hire.value = build.eh ?? DEFAULT_EP4_HIRE;
  state.showEp8Recruits.value = build.e8 === 1;

  await nextTick();

  const lu: Partial<Record<HeroId, HeroStats>> = {};

  if (build.lu) {
    for (const [id, values] of Object.entries(build.lu)) {
      lu[id as HeroId] = arrayToStats(values);
    }
  }

  state.heroLevelUps.value = lu;

  const bl: Partial<Record<HeroId, number>> = {};

  if (build.bl) {
    for (const [id, level] of Object.entries(build.bl)) {
      bl[id as HeroId] = level;
    }
  }

  state.heroBonusLevels.value = bl;

  const pw: Partial<Record<HeroId, HeroPowerSelection>> = {};

  if (build.pw) {
    for (const [id, [revealed, selected]] of Object.entries(build.pw)) {
      pw[id as HeroId] = {
        startingRevealed: revealed === 1,
        trainableSelected: selected as 0 | 1 | 2
      };
    }
  }

  state.heroPowers.value = pw;

  const sp: Partial<Record<HeroId, number>> = {};

  if (build.sp) {
    for (const [id, value] of Object.entries(build.sp)) {
      sp[id as HeroId] = value;
    }
  }

  state.heroSpecialPowers.value = sp;

  const fl: Partial<Record<HeroId, boolean>> = {};

  if (build.fl) {
    for (const id of build.fl) {
      fl[id as HeroId] = true;
    }
  }

  state.heroFlights.value = fl;
}

function statsToArray(stats: HeroStats): number[] {
  return STAT_NAMES.map((stat) => stats[stat]);
}

function isZeroStats(stats: HeroStats): boolean {
  return STAT_NAMES.every((stat) => stats[stat] === 0);
}

// * Missing entries pad with `0` so a document written before a stat existed still loads.
function arrayToStats(values: number[]): HeroStats {
  return Object.fromEntries(
    STAT_NAMES.map((stat, index) => [stat, values[index] ?? 0])
  ) as HeroStats;
}
