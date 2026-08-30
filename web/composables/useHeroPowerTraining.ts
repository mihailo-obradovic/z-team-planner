import {
  EP4_HIRE_OPTIONS,
  HERO_POWERS,
  MAX_POWER_TRAININGS,
  MAX_STAT_VALUE,
  SPECIAL_POWER_MECHANICS,
  STAT_NAMES
} from '@/types/hero';

import type {
  Hero,
  HeroId,
  HeroPowerSelection,
  HeroStats,
  StatName
} from '@/types/hero';

const ZERO_STATS: HeroStats = Object.fromEntries(
  STAT_NAMES.map((s) => [s, 0])
) as HeroStats;

const DEFAULT_POWER_STATE: HeroPowerSelection = {
  startingRevealed: false,
  trainableSelected: 0
};

// * Composable for managing power training and special power mechanics. Handles power selections, training limits, and the special powers of feature 012.
export function useHeroPowerTraining(
  heroes: Ref<Hero[] | null | undefined>,
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

  function getPowerState(id: HeroId): HeroPowerSelection {
    return heroPowers.value[id] ?? DEFAULT_POWER_STATE;
  }

  const trainingsUsed = computed(() => {
    return Object.values(heroPowers.value).filter(
      (p) => p && p.trainableSelected > 0
    ).length;
  });

  function toggleStartingPower(id: HeroId) {
    const powerSet = HERO_POWERS[id];
    if (!powerSet || !powerSet[0].name) {
      return;
    }

    if (!heroPowers.value[id]) {
      heroPowers.value[id] = { ...DEFAULT_POWER_STATE };
    }
    const powers = heroPowers.value[id]!;

    if (powers.startingRevealed) {
      // * Un-discovering: also untrain and reset any active special powers
      powers.trainableSelected = 0;
      delete heroSpecialPowers.value[id];
      powers.startingRevealed = false;
    } else {
      powers.startingRevealed = true;
    }
  }

  function toggleTrainablePower(id: HeroId, index: 1 | 2) {
    const powerSet = HERO_POWERS[id];
    if (!powerSet) {
      return;
    }

    if (!powerSet[index].name) {
      return;
    } // * Empty power slot (e.g., Blonde Blazer)

    if (!heroPowers.value[id]) {
      heroPowers.value[id] = { ...DEFAULT_POWER_STATE };
    }
    const powers = heroPowers.value[id]!;

    if (!powers.startingRevealed) {
      return;
    }
    // * Arriving in episode 8 means there was never any training to do: whoever joins then keeps only their starting power. Level-ups are a separate question — an episode 8 Waterboy still levels up, which is why FIXED_LEVEL_HEROES is not consulted here.
    if (episodeSetup.untrainableIds.value.has(id)) {
      return;
    }

    if (powers.trainableSelected === index) {
      // * Deselect: also reset any active special powers
      powers.trainableSelected = 0;
      delete heroSpecialPowers.value[id];
    } else {
      // * Only count as a new slot when switching from nothing
      if (
        powers.trainableSelected === 0 &&
        trainingsUsed.value >= MAX_POWER_TRAININGS
      ) {
        return;
      }
      powers.trainableSelected = index;
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

    const current = heroSpecialPowers.value[id] ?? 0;
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

    if (mechanics.type === 'supernova' && specialState === 1) {
      // * Flambae's Supernova: set combat and mobility to 10
      if (
        (stat === 'combat' || stat === 'mobility') &&
        mechanics.affectedStats.includes(stat)
      ) {
        const hero = heroes.value?.find((h) => h.id === id);
        if (!hero) {
          return 0;
        }

        const normalBonus = levelUp.getStatAllocations(id)[stat];

        return Math.max(
          0,
          MAX_STAT_VALUE - hero.startingStats[stat] - normalBonus
        );
      }
    } else if (mechanics.type === 'en-pointe' && specialState > 0) {
      // * Coupe's En Pointe: +1 or +3 combat/mobility based on slot
      const isUpgraded = getPowerState(id).trainableSelected === 2; // À la Seconde
      const bonus = isUpgraded ? mechanics.upgradeBonus : mechanics.baseBonus;

      if (specialState === 1 && stat === 'combat') {
        return bonus;
      }
      if (specialState === 2 && stat === 'mobility') {
        return bonus;
      }
    } else if (mechanics.type === 'spread-thin' && specialState > 0) {
      // * Golem's Spread Thin: the slot count picks a percentage tier which is floored once against the whole stat — not a per-slot increment applied repeatedly, which would pay differently on any stat that is not a multiple of 4 (feature 012).
      const hero = heroes.value?.find((h) => h.id === id);

      if (!hero) {
        return 0;
      }

      const base =
        hero.startingStats[stat] + levelUp.getStatAllocations(id)[stat];

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
      STAT_NAMES.map((s) => [s, getSpecialPowerBonus(id, s, slots)])
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

  // * Memoized special power bonuses for all heroes to prevent unnecessary re-renders
  const allSpecialPowerBonuses = computed(() => {
    const result: Partial<Record<HeroId, HeroStats>> = {};

    for (const hero of heroes.value ?? []) {
      const id = hero.id as HeroId;
      result[id] = Object.fromEntries(
        STAT_NAMES.map((s) => [s, getSpecialPowerBonus(id, s)])
      ) as HeroStats;
    }

    return result;
  });

  function getSpecialPowerBonusStats(id: HeroId): HeroStats {
    return allSpecialPowerBonuses.value[id] ?? ZERO_STATS;
  }

  function resetAllPowerTrainings() {
    heroPowers.value = {};
    heroSpecialPowers.value = {};
  }

  function resetHeroPowers(id: HeroId) {
    delete heroPowers.value[id];
    delete heroSpecialPowers.value[id];
  }

  // * Watch episode choices and reset power data when heroes are cut/not hired
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

    resetAllPowerTrainings,
    resetHeroPowers
  };
}
