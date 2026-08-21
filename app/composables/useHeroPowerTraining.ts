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
import type { useHeroEpisodeSetup } from './useHeroEpisodeSetup';
import type { useHeroLevelUp } from './useHeroLevelUp';

const ZERO_STATS: HeroStats = Object.fromEntries(
  STAT_NAMES.map((s) => [s, 0])
) as HeroStats;

const DEFAULT_POWER_STATE: HeroPowerSelection = {
  startingRevealed: false,
  trainableSelected: 0
};

/**
 * Composable for managing power training and special power mechanics.
 * Handles power selections, training limits, and special powers for Flambae and Coupe.
 */
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
    if (!powerSet || !powerSet[0].name) return;

    if (!heroPowers.value[id]) {
      heroPowers.value[id] = { ...DEFAULT_POWER_STATE };
    }
    const powers = heroPowers.value[id]!;

    if (powers.startingRevealed) {
      // Un-discovering: also untrain and reset any active special powers
      powers.trainableSelected = 0;
      delete heroSpecialPowers.value[id];
      powers.startingRevealed = false;
    } else {
      powers.startingRevealed = true;
    }
  }

  function toggleTrainablePower(id: HeroId, index: 1 | 2) {
    const powerSet = HERO_POWERS[id];
    if (!powerSet) return;

    if (!powerSet[index].name) return; // Empty power slot (e.g., Blonde Blazer)

    if (!heroPowers.value[id]) {
      heroPowers.value[id] = { ...DEFAULT_POWER_STATE };
    }
    const powers = heroPowers.value[id]!;

    if (!powers.startingRevealed) return;
    if (episodeSetup.ep8RecruitIds.value.has(id)) return;

    if (powers.trainableSelected === index) {
      // Deselect: also reset any active special powers
      powers.trainableSelected = 0;
      delete heroSpecialPowers.value[id];
    } else {
      // Only count as a new slot when switching from nothing
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

  function toggleSpecialPower(id: HeroId) {
    if (id === 'flambae') {
      // Supernova requires trainable-2 power to be trained
      const power = getPowerState(id);
      if (power.trainableSelected !== 2) return;
      // Toggle between 0 (off) and 1 (on)
      heroSpecialPowers.value[id] = heroSpecialPowers.value[id] ? 0 : 1;
    } else if (id === 'coupe') {
      // Cycle through 0 (off), 1 (+combat), 2 (+mobility)
      const current = heroSpecialPowers.value[id] ?? 0;
      heroSpecialPowers.value[id] = (current + 1) % 3;
    }
  }

  function getSpecialPowerBonus(id: HeroId, stat: StatName): number {
    const mechanics =
      SPECIAL_POWER_MECHANICS[id as keyof typeof SPECIAL_POWER_MECHANICS];

    if (!mechanics) return 0;

    const specialState = getSpecialPowerState(id);

    if (mechanics.type === 'supernova' && specialState === 1) {
      // Flambae's Supernova: set combat and mobility to 10
      if (
        (stat === 'combat' || stat === 'mobility') &&
        mechanics.affectedStats.includes(stat)
      ) {
        const hero = heroes.value?.find((h) => h.id === id);
        if (!hero) return 0;

        const normalBonus = levelUp.getStatAllocations(id)[stat];

        return Math.max(
          0,
          MAX_STAT_VALUE - hero.startingStats[stat] - normalBonus
        );
      }
    } else if (mechanics.type === 'en-pointe' && specialState > 0) {
      // Coupe's En Pointe: +1 or +3 combat/mobility based on slot
      const isUpgraded = getPowerState(id).trainableSelected === 2; // À la Seconde
      const bonus = isUpgraded ? mechanics.upgradeBonus : mechanics.baseBonus;

      if (specialState === 1 && stat === 'combat') return bonus;
      if (specialState === 2 && stat === 'mobility') return bonus;
    }

    return 0;
  }

  // Memoized special power bonuses for all heroes to prevent unnecessary re-renders
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

  // Watch episode choices and reset power data when heroes are cut/not hired
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

    resetAllPowerTrainings,
    resetHeroPowers
  };
}
