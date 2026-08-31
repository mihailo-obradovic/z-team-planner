import {
  DEFAULT_EP3_CUT,
  DEFAULT_EP4_HIRE,
  HEROES,
  STAT_NAMES
} from '@/types/hero';
import { ILLUSION_SLOT, MISSION_SLOT_COUNT } from '@/types/mission';
import { rollMissionTemplates } from '@/utils/missionTemplates';

import type {
  HeroId,
  HeroPowerSelection,
  HeroStats,
  SynergyLevel
} from '@/types/hero';
import type { MissionSlot, MissionTemplate } from '@/types/mission';
import type { PlannerState } from '@/composables/usePlannerState';
import type { SerializedBuild, SerializedMissionTemplate } from '@/types/build';

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

  // * Rolled templates are never a default, so `mt` is present on every build the tab has
  // * touched; only a state that never rolled (server render) omits it.
  if (state.missionTemplates.value) {
    build.mt = state.missionTemplates.value.map((template, index) => {
      const entry: SerializedMissionTemplate = {
        r: statsToArray(template.req)
      };

      if (index === 1) {
        const x = thresholdsToArray(template.xp);

        if (x) {
          entry.x = x;
        }
      }

      if (index === 2) {
        const f = thresholdsToArray(template.fail);

        if (f) {
          entry.f = f;
        }
      }

      return entry;
    });
  }

  if (state.missionSlots.value.some((slot) => slot !== null)) {
    build.mh = [...state.missionSlots.value];
  }

  if (state.missionSynergyLevel.value > 0) {
    build.ml = state.missionSynergyLevel.value;
  }

  if (state.missionActiveTemplate.value > 0) {
    build.ma = state.missionActiveTemplate.value;
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

  // * An old document without `mt` gets a fresh roll (feature 015) — on the client only, so a
  // * server render cannot bake one roll into the prerendered payload.
  state.missionTemplates.value = build.mt
    ? build.mt.map(readTemplate)
    : import.meta.client
      ? rollMissionTemplates()
      : null;

  state.missionSlots.value = readSlots(build.mh);
  state.missionSynergyLevel.value = readRange(build.ml, 3) as SynergyLevel;
  state.missionActiveTemplate.value = readRange(build.ma, 2);
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

// * A threshold column serializes as 5 values with 0 for unset — omitted entirely when empty.
function thresholdsToArray(
  thresholds: Partial<HeroStats>
): number[] | undefined {
  const values = STAT_NAMES.map((stat) => thresholds[stat] ?? 0);

  return values.some((value) => value > 0) ? values : undefined;
}

function arrayToThresholds(values: number[] | undefined): Partial<HeroStats> {
  const thresholds: Partial<HeroStats> = {};

  for (const [index, stat] of STAT_NAMES.entries()) {
    const value = values?.[index];

    if (value && value > 0) {
      thresholds[stat] = value;
    }
  }

  return thresholds;
}

// * Which template may carry which threshold column is fixed — a column on the wrong
// * template is dropped, exactly as the server refuses to store it.
function readTemplate(
  entry: SerializedMissionTemplate,
  index: number
): MissionTemplate {
  return {
    req: arrayToStats(entry.r),
    xp: index === 1 ? arrayToThresholds(entry.x) : {},
    fail: index === 2 ? arrayToThresholds(entry.f) : {}
  };
}

const HERO_IDS = new Set<string>(HEROES.map((hero) => hero.id));

// * Pad or truncate to the four slots; an entry that is neither a hero nor the illusion
// * marker empties its slot. A duplicated hero keeps its first slot only. Contextual cleanup
// * (a hidden hero, an illusion without Prism beside it) is the team composable's job.
function readSlots(entries: (string | null)[] | undefined): MissionSlot[] {
  const seen = new Set<string>();

  return Array.from({ length: MISSION_SLOT_COUNT }, (_, index) => {
    const entry = entries?.[index] ?? null;

    if (entry === ILLUSION_SLOT) {
      return entry;
    }

    if (entry === null || !HERO_IDS.has(entry) || seen.has(entry)) {
      return null;
    }

    seen.add(entry);

    return entry as HeroId;
  });
}

function readRange(value: number | undefined, max: number): number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0
    ? Math.min(value, max)
    : 0;
}
