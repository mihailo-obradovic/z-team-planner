import {
  HERO_STARTING_STATS,
  MAX_STAT_VALUE,
  SPECIAL_POWER_MECHANICS,
  STAT_NAMES
} from '@/types/hero';
import {
  GOLEM_COPY_SLOT,
  ILLUSION_SLOT,
  MISSION_SLOT_COUNT,
  MISSION_TEMPLATE_COUNT
} from '@/types/mission';

import { RADAR_STAT_ORDER } from '@/utils/statIcons';
import { radarCoverage } from '@/utils/radarCoverage';

import type { HeroId, HeroStats, StatName, SynergyLevel } from '@/types/hero';
import type { MissionSlot } from '@/types/mission';

type SpreadThinTraining = 'trained' | 'untrained';

// * Listed for the math panel, so every number it shows is explainable (feature 015).
export type MissionDerivedEffect =
  | { type: 'en-pointe'; stat: StatName; bonus: number }
  | { type: 'spread-thin'; copies: number }
  | { type: 'illusion'; source: HeroId; ratio: 0.5 | 1 };

// * Slots are positional because some powers pay by slot, and every write is guarded like the planner's other actions: an ineligible call is a silent no-op (feature 015).
export function useMissionSimulator(
  episodeSetup: ReturnType<typeof useHeroEpisodeSetup>,
  levelUp: ReturnType<typeof useHeroLevelUp>,
  powerTraining: ReturnType<typeof useHeroPowerTraining>
) {
  const {
    missionSlots,
    missionTemplates,
    missionSynergyLevel,
    missionActiveTemplate
  } = usePlannerState();
  const { visibleHeroes, synergyPairs } = episodeSetup;

  const missionHeroIds = computed<Set<HeroId>>(
    () => new Set(missionSlots.value.filter(isHeroSlot))
  );

  const missionCandidates = computed(() =>
    visibleHeroes.value.filter((hero) => !missionHeroIds.value.has(hero.id))
  );

  // * The stored synergy level survives losing the pair and re-applies when one returns (feature 015).
  const missionTeamHasPair = computed(() =>
    synergyPairs.value.some(
      ([a, b]) => missionHeroIds.value.has(a) && missionHeroIds.value.has(b)
    )
  );

  const missionCopyCount = computed(
    () => missionSlots.value.filter((slot) => slot === GOLEM_COPY_SLOT).length
  );

  function spreadThinTraining(): SpreadThinTraining {
    return powerTraining.getPowerState('golem').trainableSelected === 1
      ? 'trained'
      : 'untrained';
  }

  // * En Pointe and Spread Thin come from the real team, ignoring the other tabs' what-if chips; Supernova and Sonar's form flow in through the shared effective stats.
  function derivedBonuses(heroId: HeroId, index: number): HeroStats {
    if (heroId === 'coupe') {
      const mechanics = SPECIAL_POWER_MECHANICS.coupe;
      const trained =
        powerTraining.getPowerState('coupe').trainableSelected === 2;
      const bonus = trained ? mechanics.upgradeBonus : mechanics.baseBonus;
      const stat = index === 0 ? 'combat' : index === 1 ? 'mobility' : null;

      return Object.fromEntries(
        STAT_NAMES.map((name) => [name, name === stat ? bonus : 0])
      ) as HeroStats;
    }

    if (heroId === 'golem') {
      // * +25% per copy standing on the team.
      const factor =
        SPECIAL_POWER_MECHANICS.golem.percentPerSlot * missionCopyCount.value;
      const allocations = levelUp.getStatAllocations('golem');

      return Object.fromEntries(
        STAT_NAMES.map((name) => [
          name,
          Math.floor(
            (HERO_STARTING_STATS.golem[name] + allocations[name]) * factor
          )
        ])
      ) as HeroStats;
    }

    return powerTraining.getSpecialPowerBonusStats(heroId);
  }

  const prismIndex = computed(() => missionSlots.value.indexOf('prism'));

  // * An illusion mirrors its source live, never as a snapshot: half its stats floored per stat, or full once Perfect Copy is trained.
  const missionSlotStats = computed<(HeroStats | null)[]>(() => {
    const heroStats = missionSlots.value.map((slot, index) =>
      isHeroSlot(slot)
        ? powerTraining.getEffectiveStatsWithBonuses(
            slot,
            derivedBonuses(slot, index)
          )
        : null
    );

    return missionSlots.value.map((slot, index) => {
      // * A copy is Golem's own expansion — its value is already in his boosted row.
      if (slot === GOLEM_COPY_SLOT) {
        return null;
      }

      if (slot !== ILLUSION_SLOT) {
        return heroStats[index] ?? null;
      }

      const source = heroStats[prismIndex.value - 1];

      if (!source) {
        return null;
      }

      const ratio = missionIllusionRatio.value;

      return Object.fromEntries(
        STAT_NAMES.map((name) => [name, Math.floor(source[name] * ratio)])
      ) as HeroStats;
    });
  });

  const missionIllusionRatio = computed<0.5 | 1>(() =>
    powerTraining.getPowerState('prism').trainableSelected === 1 ? 1 : 0.5
  );

  // * The team total is clamped per stat, because points past 10 are wasted (feature 015).
  const missionTeamTotals = computed<HeroStats>(
    () =>
      Object.fromEntries(
        STAT_NAMES.map((stat) => [
          stat,
          Math.min(
            missionSlotStats.value.reduce(
              (sum, stats) => sum + (stats?.[stat] ?? 0),
              0
            ),
            MAX_STAT_VALUE
          )
        ])
      ) as HeroStats
  );

  const missionActiveTemplateData = computed(
    () => missionTemplates.value?.[missionActiveTemplate.value] ?? null
  );

  // * Returns every step as well as the estimate, because the math panel renders each one.
  const missionSuccess = computed(() => {
    const template = missionActiveTemplateData.value;
    const totals = missionTeamTotals.value;
    const coverage = template
      ? radarCoverage(
          RADAR_STAT_ORDER.map((stat) => totals[stat]),
          RADAR_STAT_ORDER.map((stat) => template.req[stat])
        )
      : 0;
    const synergyBonus = missionTeamHasPair.value
      ? missionSynergyLevel.value * 0.05
      : 0;
    const singleAttempt = Math.min(1, coverage + synergyBonus);
    const reattempters = missionReattempters.value;
    const failedStat = missionFailedStat.value;
    const estimate =
      failedStat !== null
        ? 0
        : 1 - (1 - singleAttempt) ** (1 + reattempters.length);

    return { coverage, synergyBonus, reattempters, failedStat, estimate };
  });

  // * Talk Shit works only in Hybrid form, which is the shared monster toggle being off (feature 012).
  const missionReattempters = computed<HeroId[]>(() => {
    const reattempters: HeroId[] = [];

    if (
      missionHeroIds.value.has('coupe') &&
      powerTraining.getPowerState('coupe').trainableSelected === 1
    ) {
      reattempters.push('coupe');
    }

    if (
      missionHeroIds.value.has('sonar') &&
      powerTraining.getPowerState('sonar').trainableSelected === 2 &&
      !powerTraining.monsterForm.value
    ) {
      reattempters.push('sonar');
    }

    return reattempters;
  });

  const missionFailedStat = computed<StatName | null>(() => {
    const fail = missionActiveTemplateData.value?.fail ?? {};

    return (
      STAT_NAMES.find((stat) => {
        const threshold = fail[stat];

        return (
          threshold !== undefined && missionTeamTotals.value[stat] >= threshold
        );
      }) ?? null
    );
  });

  // * Null while the active template carries no 2×XP threshold, and independent of the success estimate (feature 015).
  const missionXpFulfilled = computed<boolean | null>(() => {
    const xp = missionActiveTemplateData.value?.xp ?? {};
    const thresholds = Object.entries(xp) as [StatName, number][];

    if (thresholds.length === 0) {
      return null;
    }

    return thresholds.every(
      ([stat, threshold]) => missionTeamTotals.value[stat] >= threshold
    );
  });

  // * Null only for the instant before the sanitize watcher removes an illusion without a source.
  const missionIllusionSource = computed<HeroId | null>(() => {
    if (!missionSlots.value.includes(ILLUSION_SLOT) || prismIndex.value <= 0) {
      return null;
    }

    const source = missionSlots.value[prismIndex.value - 1] ?? null;

    return isHeroSlot(source) ? source : null;
  });

  const missionDerivedEffects = computed<MissionDerivedEffect[]>(() => {
    const effects: MissionDerivedEffect[] = [];
    const slots = missionSlots.value;
    const coupe = slots.indexOf('coupe');

    if (coupe === 0 || coupe === 1) {
      const bonuses = derivedBonuses('coupe', coupe);
      const stat = coupe === 0 ? 'combat' : 'mobility';

      effects.push({ type: 'en-pointe', stat, bonus: bonuses[stat] });
    }

    if (missionCopyCount.value > 0) {
      effects.push({ type: 'spread-thin', copies: missionCopyCount.value });
    }

    if (missionIllusionSource.value) {
      effects.push({
        type: 'illusion',
        source: missionIllusionSource.value,
        ratio: missionIllusionRatio.value
      });
    }

    return effects;
  });

  function fillMissionSlot(index: number, heroId: HeroId) {
    if (!isSlotIndex(index) || missionHeroIds.value.has(heroId)) {
      return;
    }

    // * A copy dissolves right-to-left; overwriting an inner one would skip the order.
    if (
      missionSlots.value[index] === GOLEM_COPY_SLOT &&
      !isRightmostCopy(missionSlots.value, index)
    ) {
      return;
    }

    if (!visibleHeroes.value.some((hero) => hero.id === heroId)) {
      return;
    }

    const slots = [...missionSlots.value];

    slots[index] = heroId;
    missionSlots.value = withSpawns(slots, heroId, index, spreadThinTraining());
  }

  // * Removing a spawned occupant is sticky: only its owner's placement creates one, so nothing recreates it here.
  function removeMissionSlot(index: number) {
    if (!isSlotIndex(index) || missionSlots.value[index] === null) {
      return;
    }

    if (
      missionSlots.value[index] === GOLEM_COPY_SLOT &&
      !isRightmostCopy(missionSlots.value, index)
    ) {
      return;
    }

    const slots = [...missionSlots.value];

    slots[index] = null;
    missionSlots.value = slots;
  }

  function moveMissionSlot(index: number, direction: -1 | 1) {
    const target = index + direction;
    const moved = missionSlots.value[index] ?? null;

    if (!isSlotIndex(index) || !isSlotIndex(target) || !isHeroSlot(moved)) {
      return;
    }

    const slots = [...missionSlots.value];

    slots[index] = slots[target]!;
    slots[target] = moved;

    // * Moving a hero is placing them again — the passive partner of a swap is not placed.
    missionSlots.value = withSpawns(slots, moved, target, spreadThinTraining());
  }

  function setMissionReq(template: number, stat: StatName, value: number) {
    if (!isTemplateIndex(template) || !isStatValue(value, 0)) {
      return;
    }

    updateTemplate(template, (entry) => ({
      ...entry,
      req: { ...entry.req, [stat]: value }
    }));
  }

  // * Both condition columns are configurable on any template. `null` unsets.
  function setMissionThreshold(
    template: number,
    kind: 'xp' | 'fail',
    stat: StatName,
    value: number | null
  ) {
    if (!isTemplateIndex(template)) {
      return;
    }

    if (value !== null && !isStatValue(value, 1)) {
      return;
    }

    updateTemplate(template, (entry) => ({
      ...entry,
      // * At most one threshold per column; unsetting clears only a value that stat actually holds.
      [kind]:
        value === null
          ? entry[kind][stat] === undefined
            ? entry[kind]
            : {}
          : { [stat]: value }
    }));
  }

  function setMissionSynergyLevel(level: SynergyLevel) {
    if ([0, 1, 2, 3].includes(level)) {
      missionSynergyLevel.value = level;
    }
  }

  function setMissionActiveTemplate(index: number) {
    if (isTemplateIndex(index)) {
      missionActiveTemplate.value = index;
    }
  }

  function updateTemplate(
    index: number,
    change: (
      entry: NonNullable<typeof missionTemplates.value>[number]
    ) => NonNullable<typeof missionTemplates.value>[number]
  ) {
    const templates = missionTemplates.value;

    if (templates) {
      missionTemplates.value = templates.map((entry, at) =>
        at === index ? change(entry) : entry
      );
    }
  }

  // * Validity is enforced continuously but creation only on placement, so this same watcher drops a hidden hero or a contextless spawn after an episode change or a load.
  watch(
    [
      missionSlots,
      visibleHeroes,
      () => powerTraining.getPowerState('golem').trainableSelected
    ],
    () => {
      const cleaned = sanitize(
        missionSlots.value,
        visibleHeroes.value,
        spreadThinTraining()
      );

      if (cleaned.some((slot, index) => slot !== missionSlots.value[index])) {
        missionSlots.value = cleaned;
      }
    },
    { immediate: true }
  );

  return {
    missionSlots,
    missionTemplates,
    missionSynergyLevel,
    missionActiveTemplate,
    missionHeroIds,
    missionCandidates,
    missionCopyCount,
    missionTeamHasPair,
    missionSlotStats,
    missionTeamTotals,
    missionDerivedEffects,
    missionIllusionSource,
    missionIllusionRatio,
    missionActiveTemplateData,
    missionSuccess,
    missionXpFulfilled,
    fillMissionSlot,
    removeMissionSlot,
    moveMissionSlot,
    setMissionReq,
    setMissionThreshold,
    setMissionSynergyLevel,
    setMissionActiveTemplate
  };
}

function isSlotIndex(value: number): boolean {
  return Number.isInteger(value) && value >= 0 && value < MISSION_SLOT_COUNT;
}

function isTemplateIndex(value: number): boolean {
  return (
    Number.isInteger(value) && value >= 0 && value < MISSION_TEMPLATE_COUNT
  );
}

function isStatValue(value: number, min: number): boolean {
  return Number.isInteger(value) && value >= min && value <= MAX_STAT_VALUE;
}

function isHeroSlot(slot: MissionSlot): slot is HeroId {
  return slot !== null && slot !== ILLUSION_SLOT && slot !== GOLEM_COPY_SLOT;
}

// * Placing Prism spawns her left neighbor's illusion in a free slot to her right; placing Golem with Spread Thin trained fills every free slot to his right with copies (feature 015).
function withSpawns(
  slots: MissionSlot[],
  placed: HeroId,
  index: number,
  spreadThin: SpreadThinTraining
): MissionSlot[] {
  if (placed === 'prism') {
    const right = index + 1;

    if (
      right < MISSION_SLOT_COUNT &&
      slots[right] === null &&
      isHeroSlot(slots[index - 1] ?? null)
    ) {
      const next = [...slots];

      next[right] = ILLUSION_SLOT;

      return next;
    }

    return slots;
  }

  if (placed === 'golem' && spreadThin === 'trained') {
    return slots.map((slot, at) =>
      at > index && slot === null ? GOLEM_COPY_SLOT : slot
    );
  }

  return slots;
}

function isRightmostCopy(slots: MissionSlot[], index: number): boolean {
  return slots.lastIndexOf(GOLEM_COPY_SLOT) === index;
}

function sanitize(
  slots: MissionSlot[],
  visible: { id: HeroId }[],
  spreadThin: SpreadThinTraining
): MissionSlot[] {
  const visibleIds = new Set(visible.map((hero) => hero.id));
  const heroesOnly = slots.map((slot) =>
    isHeroSlot(slot) && !visibleIds.has(slot) ? null : slot
  );
  const prism = heroesOnly.indexOf('prism');
  const golem = heroesOnly.indexOf('golem');

  return heroesOnly.map((slot, index) => {
    if (
      slot === ILLUSION_SLOT &&
      !(
        prism > 0 &&
        index === prism + 1 &&
        isHeroSlot(heroesOnly[prism - 1] ?? null)
      )
    ) {
      return null;
    }

    // * A copy stands only to Golem's right, and only while Spread Thin is trained.
    if (
      slot === GOLEM_COPY_SLOT &&
      !(spreadThin === 'trained' && golem >= 0 && index > golem)
    ) {
      return null;
    }

    return slot;
  });
}
