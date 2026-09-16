import {
  DEFAULT_EP3_CUT,
  DEFAULT_EP4_HIRE,
  HEROES,
  STAT_NAMES
} from '@/types/hero';
import {
  DEFAULT_MISSION_TEMPLATES,
  GOLEM_COPY_SLOT,
  ILLUSION_SLOT,
  MISSION_SLOT_COUNT
} from '@/types/mission';

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
  const buildDocument: SerializedBuild = { v: 1 };

  if (state.ep3Cut.value !== DEFAULT_EP3_CUT) {
    buildDocument.ec = state.ep3Cut.value;
  }

  if (state.ep4Hire.value !== DEFAULT_EP4_HIRE) {
    buildDocument.eh = state.ep4Hire.value;
  }

  if (state.showEp8Recruits.value) {
    buildDocument.e8 = 1;
  }

  const lu: Record<string, number[]> = {};

  for (const [id, stats] of Object.entries(state.heroLevelUps.value)) {
    if (stats && !isZeroStats(stats)) {
      lu[id] = statsToArray(stats);
    }
  }

  if (Object.keys(lu).length > 0) {
    buildDocument.lu = lu;
  }

  const bl: Record<string, number> = {};

  for (const [id, level] of Object.entries(state.heroBonusLevels.value)) {
    if (level && level > 0) {
      bl[id] = level;
    }
  }

  if (Object.keys(bl).length > 0) {
    buildDocument.bl = bl;
  }

  const pw: Record<string, [number, number]> = {};

  for (const [id, power] of Object.entries(state.heroPowers.value)) {
    if (power && (power.startingRevealed || power.trainableSelected > 0)) {
      pw[id] = [power.startingRevealed ? 1 : 0, power.trainableSelected];
    }
  }

  if (Object.keys(pw).length > 0) {
    buildDocument.pw = pw;
  }

  const sp: Record<string, number> = {};

  for (const [id, value] of Object.entries(state.heroSpecialPowers.value)) {
    if (value && value > 0) {
      sp[id] = value;
    }
  }

  if (Object.keys(sp).length > 0) {
    buildDocument.sp = sp;
  }

  const fl: string[] = [];

  for (const [id, flying] of Object.entries(state.heroFlights.value)) {
    if (flying) {
      fl.push(id);
    }
  }

  if (fl.length > 0) {
    buildDocument.fl = fl;
  }

  const mt = state.missionTemplates.value.map(templateToEntry);

  if (JSON.stringify(mt) !== DEFAULT_TEMPLATE_ENTRIES) {
    buildDocument.mt = mt;
  }

  if (state.missionSlots.value.some((slot) => slot !== null)) {
    buildDocument.mh = [...state.missionSlots.value];
  }

  if (state.missionSynergyLevel.value > 0) {
    buildDocument.ml = state.missionSynergyLevel.value;
  }

  if (state.missionActiveTemplate.value > 0) {
    buildDocument.ma = state.missionActiveTemplate.value;
  }

  return buildDocument;
}

// ! Episode choices are written first and the rest only after `nextTick()`: the sub-composables watch those flags and reset allocations for cut and non-hired heroes on the next tick, which would otherwise wipe the values this function has just loaded.
export async function deserializeBuild(
  buildDocument: SerializedBuild,
  state: PlannerState
): Promise<void> {
  state.ep3Cut.value = buildDocument.ec ?? DEFAULT_EP3_CUT;
  state.ep4Hire.value = buildDocument.eh ?? DEFAULT_EP4_HIRE;
  state.showEp8Recruits.value = buildDocument.e8 === 1;

  await nextTick();

  const lu: Partial<Record<HeroId, HeroStats>> = {};

  if (buildDocument.lu) {
    for (const [id, values] of Object.entries(buildDocument.lu)) {
      lu[id as HeroId] = arrayToStats(values);
    }
  }

  state.heroLevelUps.value = lu;

  const bl: Partial<Record<HeroId, number>> = {};

  if (buildDocument.bl) {
    for (const [id, level] of Object.entries(buildDocument.bl)) {
      bl[id as HeroId] = level;
    }
  }

  state.heroBonusLevels.value = bl;

  const pw: Partial<Record<HeroId, HeroPowerSelection>> = {};

  if (buildDocument.pw) {
    for (const [id, [revealed, selected]] of Object.entries(buildDocument.pw)) {
      pw[id as HeroId] = {
        startingRevealed: revealed === 1,
        trainableSelected: selected as 0 | 1 | 2
      };
    }
  }

  state.heroPowers.value = pw;

  const sp: Partial<Record<HeroId, number>> = {};

  if (buildDocument.sp) {
    for (const [id, value] of Object.entries(buildDocument.sp)) {
      sp[id as HeroId] = value;
    }
  }

  state.heroSpecialPowers.value = sp;

  const fl: Partial<Record<HeroId, boolean>> = {};

  if (buildDocument.fl) {
    for (const id of buildDocument.fl) {
      fl[id as HeroId] = true;
    }
  }

  state.heroFlights.value = fl;

  state.missionTemplates.value =
    buildDocument.mt?.map(readTemplate) ??
    structuredClone(DEFAULT_MISSION_TEMPLATES);

  state.missionSlots.value = readSlots(buildDocument.mh);
  state.missionSynergyLevel.value = readRange(
    buildDocument.ml,
    3
  ) as SynergyLevel;
  state.missionActiveTemplate.value = readRange(buildDocument.ma, 2);
}

function statsToArray(stats: HeroStats): number[] {
  return STAT_NAMES.map((stat) => stats[stat]);
}

function isZeroStats(stats: HeroStats): boolean {
  return STAT_NAMES.every((stat) => stats[stat] === 0);
}

// * Missing entries read as `0`, because a share link's contents reach this unvalidated (feature 001).
function arrayToStats(values: number[]): HeroStats {
  return Object.fromEntries(
    STAT_NAMES.map((stat, index) => [stat, values[index] ?? 0])
  ) as HeroStats;
}

// * Omitted entirely when no stat carries a threshold.
function thresholdsToArray(
  thresholds: Partial<HeroStats>
): number[] | undefined {
  const values = STAT_NAMES.map((stat) => thresholds[stat] ?? 0);

  return values.some((value) => value > 0) ? values : undefined;
}

// * A column carries at most one threshold; a document claiming more keeps the first.
function arrayToThresholds(values: number[] | undefined): Partial<HeroStats> {
  for (const [index, stat] of STAT_NAMES.entries()) {
    const value = values?.[index];

    if (value && value > 0) {
      return { [stat]: value };
    }
  }

  return {};
}

function templateToEntry(template: MissionTemplate): SerializedMissionTemplate {
  const entry: SerializedMissionTemplate = { r: statsToArray(template.req) };
  const x = thresholdsToArray(template.xp);
  const f = thresholdsToArray(template.fail);

  if (x) {
    entry.x = x;
  }

  if (f) {
    entry.f = f;
  }

  return entry;
}

function readTemplate(entry: SerializedMissionTemplate): MissionTemplate {
  return {
    req: arrayToStats(entry.r),
    xp: arrayToThresholds(entry.x),
    fail: arrayToThresholds(entry.f)
  };
}

const DEFAULT_TEMPLATE_ENTRIES = JSON.stringify(
  DEFAULT_MISSION_TEMPLATES.map(templateToEntry)
);

const HERO_IDS = new Set<string>(HEROES.map((hero) => hero.id));

// * Only structural cleanup happens here; contextual cleanup, such as a hidden hero or an illusion without Prism beside it, is the team composable's job.
function readSlots(entries: (string | null)[] | undefined): MissionSlot[] {
  const seen = new Set<string>();

  return Array.from({ length: MISSION_SLOT_COUNT }, (_, index) => {
    const entry = entries?.[index] ?? null;

    if (entry === ILLUSION_SLOT || entry === GOLEM_COPY_SLOT) {
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
