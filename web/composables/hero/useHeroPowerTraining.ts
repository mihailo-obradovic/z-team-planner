import {
  EP4_HIRE_OPTIONS,
  HEROES,
  HERO_POWERS,
  HERO_STARTING_STATS,
  MAX_POWER_TRAININGS,
  MAX_STAT_VALUE,
  SPECIAL_POWER_MECHANICS,
  STAT_NAMES
} from '@/types/hero';

import type {
  HeroId,
  HeroPowerSelection,
  HeroStats,
  StatName
} from '@/types/hero';

const ZERO_STATS: HeroStats = Object.fromEntries(
  STAT_NAMES.map((stat) => [stat, 0])
) as HeroStats;

const DEFAULT_POWER_STATE: HeroPowerSelection = {
  startingRevealed: false,
  trainableSelected: 0
};

const MONSTER_FORM_SWAPS: Partial<Record<StatName, StatName>> = {
  combat: 'intellect',
  intellect: 'combat',
  vigor: 'charisma',
  charisma: 'vigor'
};

export function useHeroPowerTraining(
  episodeSetup: ReturnType<typeof useHeroEpisodeSetup>,
  levelUp: ReturnType<typeof useHeroLevelUp>
) {
  const heroPowers = useState<Partial<Record<HeroId, HeroPowerSelection>>>(
    'heroPowers',
    () => ({})
  );

  const heroSpecialPowers = useState<Partial<Record<HeroId, number>>>(
    'heroSpecialPowers',
    () => ({})
  );

  // * Sonar's form is display-only shared state: one form everywhere it renders, never serialized into a build (features 012/014).
  const monsterForm = useState('monsterForm', () => false);

  function toggleMonsterForm() {
    monsterForm.value = !monsterForm.value;
  }

  function resolveDisplayStat(id: HeroId, stat: StatName): StatName {
    if (id === 'sonar' && monsterForm.value) {
      return MONSTER_FORM_SWAPS[stat] ?? stat;
    }

    return stat;
  }

  function getPowerState(id: HeroId): HeroPowerSelection {
    return heroPowers.value[id] ?? DEFAULT_POWER_STATE;
  }

  const trainingsUsed = computed(
    () =>
      Object.values(heroPowers.value).filter(
        (power) => power && power.trainableSelected > 0
      ).length
  );

  function toggleStartingPower(id: HeroId) {
    if (!HERO_POWERS[id]) {
      return;
    }

    const powers = (heroPowers.value[id] ??= { ...DEFAULT_POWER_STATE });

    if (powers.startingRevealed) {
      powers.trainableSelected = 0;
      delete heroSpecialPowers.value[id];
      powers.startingRevealed = false;
    } else {
      powers.startingRevealed = true;
    }
  }

  function toggleTrainablePower(id: HeroId, index: 1 | 2) {
    const powerSet = HERO_POWERS[id];

    // * A one-power hero (Blonde Blazer) has no slot to train.
    if (!powerSet || index >= powerSet.length) {
      return;
    }

    const powers = (heroPowers.value[id] ??= { ...DEFAULT_POWER_STATE });

    if (!powers.startingRevealed) {
      return;
    }

    // * Episode 8 recruits never train powers. Level-ups are a separate question, which is why FIXED_LEVEL_HEROES is not consulted: an episode 8 Waterboy still levels up.
    if (episodeSetup.ep8RecruitIds.value.has(id)) {
      return;
    }

    if (powers.trainableSelected === index) {
      powers.trainableSelected = 0;
    } else {
      // * Switching between the two options spends no new training.
      if (
        powers.trainableSelected === 0 &&
        trainingsUsed.value >= MAX_POWER_TRAININGS
      ) {
        return;
      }

      powers.trainableSelected = index;
    }

    // ! Clears a gated effect the selection no longer satisfies on every path, not only deselection (feature 012, Clearing): `getSpecialPowerBonus` does not re-check the gate, so a leftover state keeps paying out and serializes into a build the API rejects.
    // * Asking the gate rather than clearing outright keeps Coupé's ungated En Pointe, whose bonus her trainables only resize.
    const mechanics = specialPowerMechanics(id);

    if (mechanics && !hasRequiredPower(id, mechanics)) {
      delete heroSpecialPowers.value[id];
    }
  }

  function getSpecialPowerState(id: HeroId): number {
    return heroSpecialPowers.value[id] ?? 0;
  }

  // * One cycle for every special power: `0 .. max`, wrapping back to off. Supernova's max is 1, so it reads as a plain on/off; En Pointe's 2 is off/combat/mobility; Spread Thin's 3 is off/1/2/3 slots.
  function toggleSpecialPower(id: HeroId) {
    const mechanics = specialPowerMechanics(id);

    if (!mechanics || !hasRequiredPower(id, mechanics)) {
      return;
    }

    const current = getSpecialPowerState(id);

    heroSpecialPowers.value[id] = (current + 1) % (mechanics.max + 1);
  }

  function getSpecialPowerBonus(
    id: HeroId,
    stat: StatName,
    state?: number
  ): number {
    const mechanics = specialPowerMechanics(id);

    if (!mechanics) {
      return 0;
    }

    const specialState = state ?? getSpecialPowerState(id);
    const base =
      HERO_STARTING_STATS[id][stat] + levelUp.getStatAllocations(id)[stat];

    if (mechanics.type === 'supernova' && specialState === 1) {
      if ((mechanics.affectedStats as readonly StatName[]).includes(stat)) {
        return Math.max(0, MAX_STAT_VALUE - base);
      }
    } else if (mechanics.type === 'en-pointe' && specialState > 0) {
      const alaSecondeTrained = getPowerState(id).trainableSelected === 2;
      const bonus = alaSecondeTrained
        ? mechanics.upgradeBonus
        : mechanics.baseBonus;
      const boostedStat = specialState === 1 ? 'combat' : 'mobility';

      if (stat === boostedStat) {
        // * Clamped like Spread Thin: an allocation can already sit at 10, and the effective stat never passes it (feature 012).
        return Math.min(bonus, MAX_STAT_VALUE - base);
      }
    } else if (mechanics.type === 'spread-thin' && specialState > 0) {
      // * The slot count picks a percentage tier floored once against the whole stat, not a per-slot increment, which would pay differently on any stat that is not a multiple of 4 (feature 012).
      return Math.min(
        Math.floor(base * mechanics.percentPerSlot * specialState),
        MAX_STAT_VALUE - base
      );
    }

    return 0;
  }

  // * The pair total in the detail dialog is a two-hero call, so the partner fills a slot Golem would otherwise have expanded into: one fewer than his own card shows (feature 012).
  function getPairSpecialPowerBonusStats(id: HeroId): HeroStats {
    const mechanics = specialPowerMechanics(id);

    if (mechanics?.type !== 'spread-thin') {
      return getSpecialPowerBonusStats(id);
    }

    const slots = Math.min(getSpecialPowerState(id), mechanics.max - 1);

    return Object.fromEntries(
      STAT_NAMES.map((stat) => [stat, getSpecialPowerBonus(id, stat, slots)])
    ) as HeroStats;
  }

  function specialPowerMechanics(id: HeroId) {
    return SPECIAL_POWER_MECHANICS[
      id as keyof typeof SPECIAL_POWER_MECHANICS
    ] as
      | (typeof SPECIAL_POWER_MECHANICS)[keyof typeof SPECIAL_POWER_MECHANICS]
      | undefined;
  }

  function hasRequiredPower(
    id: HeroId,
    mechanics: NonNullable<ReturnType<typeof specialPowerMechanics>>
  ): boolean {
    if (!('requiredPower' in mechanics)) {
      return true;
    }

    return (
      getPowerState(id).trainableSelected ===
      Number(mechanics.requiredPower.slice(-1))
    );
  }

  const allSpecialPowerBonuses = computed(() => {
    const result: Partial<Record<HeroId, HeroStats>> = {};

    for (const { id } of HEROES) {
      result[id] = Object.fromEntries(
        STAT_NAMES.map((stat) => [stat, getSpecialPowerBonus(id, stat)])
      ) as HeroStats;
    }

    return result;
  });

  function getSpecialPowerBonusStats(id: HeroId): HeroStats {
    return allSpecialPowerBonuses.value[id] ?? ZERO_STATS;
  }

  // * A hero's displayed value per stat — the one every surface renders: form-resolved, then clamped so it never passes MAX_STAT_VALUE (feature 012).
  function getEffectiveStats(id: HeroId): HeroStats {
    return effectiveStats(id, getSpecialPowerBonusStats(id));
  }

  // * The hero's side of a pair total: the same shape with the two-hero call's slot deduction applied (feature 012).
  function getPairEffectiveStats(id: HeroId): HeroStats {
    return effectiveStats(id, getPairSpecialPowerBonusStats(id));
  }

  // * A synergy pair's per-stat total: both heroes' effective stats, each clamped, then summed — the sum itself may exceed MAX_STAT_VALUE (feature 014). The one computation behind the dialog's pair block and the synergy tab.
  function getPairCombinedStats(id1: HeroId, id2: HeroId): HeroStats {
    const first = getPairEffectiveStats(id1);
    const second = getPairEffectiveStats(id2);

    return Object.fromEntries(
      STAT_NAMES.map((stat) => [stat, first[stat] + second[stat]])
    ) as HeroStats;
  }

  function effectiveStats(id: HeroId, bonuses: HeroStats): HeroStats {
    const startingStats = HERO_STARTING_STATS[id];
    const allocations = levelUp.getStatAllocations(id);

    return Object.fromEntries(
      STAT_NAMES.map((stat) => {
        const resolved = resolveDisplayStat(id, stat);

        return [
          stat,
          Math.min(
            startingStats[resolved] + allocations[resolved] + bonuses[resolved],
            MAX_STAT_VALUE
          )
        ];
      })
    ) as HeroStats;
  }

  function resetAllPowerTrainings() {
    heroPowers.value = {};
    heroSpecialPowers.value = {};
  }

  function resetHeroPowers(id: HeroId) {
    delete heroPowers.value[id];
    delete heroSpecialPowers.value[id];
  }

  watch(episodeSetup.ep3Cut, resetHeroPowers);

  watch(episodeSetup.ep4Hire, (newHire) => {
    for (const heroId of EP4_HIRE_OPTIONS) {
      if (heroId !== newHire) {
        resetHeroPowers(heroId);
      }
    }
  });

  return {
    getPowerState,
    toggleStartingPower,
    toggleTrainablePower,
    trainingsUsed,

    getSpecialPowerState,
    toggleSpecialPower,
    getSpecialPowerBonusStats,
    getPairSpecialPowerBonusStats,
    getEffectiveStats,
    getPairEffectiveStats,
    getPairCombinedStats,
    // * The mission simulator (feature 015) derives En Pointe and Spread Thin from real slots and must not re-implement the clamp or Sonar's form resolution.
    getEffectiveStatsWithBonuses: effectiveStats,

    monsterForm,
    toggleMonsterForm,
    resolveDisplayStat,

    resetAllPowerTrainings,
    resetHeroPowers
  };
}
