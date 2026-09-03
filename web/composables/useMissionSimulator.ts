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
import type { useHeroEpisodeSetup } from '@/composables/useHeroEpisodeSetup';
import type { useHeroLevelUp } from '@/composables/useHeroLevelUp';
import type { useHeroPowerTraining } from '@/composables/useHeroPowerTraining';

// * The effects the simulator derives, listed for the math panel so every number is
// * explainable (feature 015).
export type MissionDerivedEffect =
  | { type: 'en-pointe'; stat: StatName; bonus: number }
  | { type: 'spread-thin'; copies: number }
  | { type: 'illusion'; source: HeroId; ratio: 0.5 | 1 };

// * Feature 015 — the mission team and template state actions. Slots are positional: some
// * powers pay by slot, so order is part of the state, and every write is guarded the way
// * the planner's other actions are (an ineligible call is a silent no-op).
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

  // * What the slot picker offers: the current roster, minus heroes already on the team.
  const missionCandidates = computed(() =>
    visibleHeroes.value.filter((hero) => !missionHeroIds.value.has(hero.id))
  );

  // * The synergy switch is meaningful only while the team holds a derived pair; the stored
  // * level survives losing it and re-applies when a pair returns (feature 015).
  const missionTeamHasPair = computed(() =>
    synergyPairs.value.some(
      ([a, b]) => missionHeroIds.value.has(a) && missionHeroIds.value.has(b)
    )
  );

  const missionCopyCount = computed(
    () => missionSlots.value.filter((slot) => slot === GOLEM_COPY_SLOT).length
  );

  function spreadThinTrained(): boolean {
    return powerTraining.getPowerState('golem').trainableSelected === 1;
  }

  // * En Pointe and Spread Thin are derived from the real team here — the manual what-if
  // * chips the other tabs show are ignored and never written. Everything else (Supernova,
  // * Sonar's form) flows in through the shared effective stats.
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
      // * The copies are the mechanism now: +25% per copy standing on the team.
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

  // * Each slot's contribution to the team: a hero's simulator-effective stats (per-hero
  // * clamp included), or the illusion's — its source's stats at half, floored per stat,
  // * full once Perfect Copy is trained. It mirrors the source live, never a snapshot.
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

  // * The five totals the radar and the checks read: contributions summed, then the team
  // * total clamped at the per-stat maximum — points past 10 are wasted (feature 015).
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

  // * The estimate, with every step it is built from — the math panel renders these rows.
  // * Coverage and synergy make the single-attempt chance (capped at 100%), reattempt
  // * powers retry it, and a tripped fail threshold overrides everything to 0%.
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

  // * Pirouette is Coupé's first trainable, Talk Shit Sonar's second — and Talk Shit works
  // * only in Hybrid form, which is the shared monster toggle being off (feature 012).
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

  // * The first FAIL ≥ stat whose clamped team total meets its threshold — at-or-above.
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

  // * The 2×XP light: null while the active template carries no thresholds, otherwise
  // * whether every set threshold is met. Independent of the success estimate (feature 015).
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

  // * Who the illusion mirrors: the hero to Prism's left, or nobody. The sanitize watcher
  // * below keeps an illusion from standing without one, so this returns null only for the
  // * frame-less instant before it runs — and every reader gets a hero id or nothing.
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

    if ((coupe === 0 || coupe === 1) && isHeroSlot(slots[coupe]!)) {
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
    missionSlots.value = withSpawns(slots, heroId, index, spreadThinTrained());
  }

  // * Removal is the same for a hero and the spawned occupants — and for those it is
  // * sticky: creation happens only on their owner's placement, so nothing recreates them
  // * here. Golem's copies dissolve right-to-left only.
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
    missionSlots.value = withSpawns(slots, moved, target, spreadThinTrained());
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
      // * At most one threshold per column: setting a stat's value replaces any other;
      // * unsetting clears only a value that stat actually holds.
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

  // * Slot validity is enforced continuously, creation only on placement: a hidden hero
  // * (episode change, or a stale document) leaves the team, and the illusion survives only
  // * in its exact context — directly to Prism's right, with a hero to her left. This same
  // * watcher is what drops contextless entries after deserialization.
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
        spreadThinTrained()
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

// * Placement spawns (feature 015). Prism placed: the illusion of her left neighbor
// * appears in the slot to her right when that slot is free. Golem placed with Spread Thin
// * trained: a copy of him fills every free slot to his right.
function withSpawns(
  slots: MissionSlot[],
  placed: HeroId,
  index: number,
  golemTrained: boolean
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

  if (placed === 'golem' && golemTrained) {
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
  golemTrained: boolean
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
      !(golemTrained && golem >= 0 && index > golem)
    ) {
      return null;
    }

    return slot;
  });
}
