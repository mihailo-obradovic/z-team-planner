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

  const DEFAULT_POWER_STATE: HeroPowerSelection = {
    startingRevealed: false,
    trainableSelected: 0
  };

  function getPowerState(id: HeroId): HeroPowerSelection {
    return heroPowers.value[id] ?? DEFAULT_POWER_STATE;
  }

  const trainingsUsed = computed(() => {
    return Object.values(heroPowers.value).filter(
      (p) => p && p.trainableSelected > 0
    ).length;
  });

  function togglePower(id: HeroId, index: 0 | 1 | 2) {
    // Validate that the power exists
    const powerSet = HERO_POWERS[id];

    if (!powerSet) {
      return;
    }

    const power = powerSet[index];

    if (!power.name) {
      return;
    } // Empty power slot (e.g., Blonde Blazer)

    if (!heroPowers.value[id]) {
      heroPowers.value[id] = {
        startingRevealed: false,
        trainableSelected: 0
      };
    }
    const powers = heroPowers.value[id]!;

    if (index === 0) {
      // Toggle starting power (only if no trainable is selected)
      if (powers.startingRevealed && powers.trainableSelected > 0) {
        return;
      }

      powers.startingRevealed = !powers.startingRevealed;
    } else {
      // Toggle trainable power (1 or 2)
      if (episodeSetup.ep8RecruitIds.value.has(id)) {
        return;
      }

      if (powers.trainableSelected === index) {
        // Deselect current trainable
        powers.trainableSelected = 0;
      } else {
        // Check training limit
        if (
          powers.trainableSelected === 0 &&
          trainingsUsed.value >= MAX_POWER_TRAININGS
        ) {
          return;
        }

        // Select new trainable (automatically deselects the other)
        powers.trainableSelected = index as 1 | 2;
        powers.startingRevealed = true; // Auto-reveal starting when selecting trainable
      }
    }
  }

  function getSpecialPowerState(id: HeroId): number {
    return heroSpecialPowers.value[id] ?? 0;
  }

  function toggleSpecialPower(id: HeroId) {
    if (id === 'flambae') {
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

    if (!mechanics) {
      return 0;
    }

    const specialState = getSpecialPowerState(id);

    if (mechanics.type === 'supernova' && specialState === 1) {
      // Flambae's Supernova: set combat and mobility to 10
      if (
        (stat === 'combat' || stat === 'mobility') &&
        mechanics.affectedStats.includes(stat)
      ) {
        const hero = heroes.value?.find((h) => h.id === id);
        if (!hero) {
          return 0;
        }

        const normalBonus = levelUp.getStatBonuses(id)[stat];

        return Math.max(
          0,
          MAX_STAT_VALUE - hero.startingStats[stat] - normalBonus
        );
      }
    } else if (mechanics.type === 'en-pointe' && specialState > 0) {
      // Coupe's En Pointe: +1 or +3 combat/mobility based on slot
      const powerStates = getPowerState(id);
      const isUpgraded = powerStates.trainableSelected === 2; // À la Seconde
      const bonus = isUpgraded ? mechanics.upgradeBonus : mechanics.baseBonus;

      if (specialState === 1 && stat === 'combat') {
        return bonus;
      }

      if (specialState === 2 && stat === 'mobility') {
        return bonus;
      }
    }

    return 0;
  }

  // Memoized special power bonuses for all heroes to prevent unnecessary re-renders
  const allSpecialPowerBonuses = computed(() => {
    const result: Partial<Record<HeroId, HeroStats>> = {};

    for (const hero of heroes.value ?? []) {
      const id = hero.id as HeroId;
      result[id] = {
        combat: getSpecialPowerBonus(id, 'combat'),
        intellect: getSpecialPowerBonus(id, 'intellect'),
        vigor: getSpecialPowerBonus(id, 'vigor'),
        charisma: getSpecialPowerBonus(id, 'charisma'),
        mobility: getSpecialPowerBonus(id, 'mobility')
      };
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

  function clearHeroPowers(id: HeroId) {
    delete heroPowers.value[id];
    delete heroSpecialPowers.value[id];
  }

  // Watch episode choices and clear power data when heroes are cut/not hired
  watch(episodeSetup.ep3Cut, (newCut) => {
    delete heroPowers.value[newCut];
    delete heroSpecialPowers.value[newCut];
  });

  watch(episodeSetup.ep4Hire, (newHire) => {
    for (const heroId of EP4_HIRE_OPTIONS) {
      if (heroId !== newHire) {
        delete heroPowers.value[heroId];
        delete heroSpecialPowers.value[heroId];
      }
    }
  });

  return {
    heroPowers,
    heroSpecialPowers,
    getPowerState,
    togglePower,
    trainingsUsed,
    getSpecialPowerState,
    toggleSpecialPower,
    getSpecialPowerBonus,
    getSpecialPowerBonusStats,
    resetAllPowerTrainings,
    clearHeroPowers
  };
}
