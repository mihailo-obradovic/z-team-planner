import {
  EP4_HIRE_OPTIONS,
  FIXED_LEVEL_HEROES,
  MAX_LEVEL_UPS,
  MAX_STAT_VALUE,
  MAX_BONUS_POINTS,
  MAX_BONUS_LEVEL_PER_HERO,
  STAT_NAMES
} from '@/types/hero';
import type { Hero, HeroId, HeroStats, StatName } from '@/types/hero';
import type { useHeroEpisodeSetup } from './useHeroEpisodeSetup';

const ZERO_STATS: HeroStats = Object.fromEntries(
  STAT_NAMES.map((s) => [s, 0])
) as HeroStats;

/**
 * Composable for managing hero level-ups and bonus levels.
 * Handles stat allocation, point tracking, and bonus level system.
 */
export function useHeroLevelUp(
  heroes: Ref<Hero[] | null | undefined>,
  episodeSetup: ReturnType<typeof useHeroEpisodeSetup>
) {
  const heroLevelUps = useState<Partial<Record<HeroId, HeroStats>>>(
    'heroLevelUps',
    () => ({})
  );

  const heroBonusLevels = useState<Partial<Record<HeroId, number>>>(
    'heroBonusLevels',
    () => ({})
  );

  function getStatAllocations(id: HeroId): HeroStats {
    return heroLevelUps.value[id] ?? ZERO_STATS;
  }

  function getLevelUpPointsUsed(id: HeroId): number {
    const allocations = getStatAllocations(id);

    return STAT_NAMES.reduce((sum, s) => sum + allocations[s], 0);
  }

  function getBonusLevel(id: HeroId): number {
    return heroBonusLevels.value[id] ?? 0;
  }

  const bonusLevelsUsed = computed(() => {
    return Object.values(heroBonusLevels.value).reduce(
      (sum, v) => sum + (v ?? 0),
      0
    );
  });

  function statUp(id: HeroId, stat: StatName) {
    if (id in FIXED_LEVEL_HEROES) {
      return;
    }

    const hero = heroes.value?.find((h) => h.id === id);
    if (!hero) {
      return;
    }

    if (!heroLevelUps.value[id]) {
      heroLevelUps.value[id] = { ...ZERO_STATS };
    }

    const allocations = heroLevelUps.value[id]!;

    const effectiveLevelCap = MAX_LEVEL_UPS + getBonusLevel(id);

    if (getLevelUpPointsUsed(id) >= effectiveLevelCap) {
      return;
    }

    if (hero.startingStats[stat] + allocations[stat] >= MAX_STAT_VALUE) {
      return;
    }

    allocations[stat]++;
  }

  function statDown(id: HeroId, stat: StatName) {
    if (id in FIXED_LEVEL_HEROES) {
      return;
    }

    if (!heroLevelUps.value[id]) {
      return;
    }

    const allocations = heroLevelUps.value[id]!;

    if (allocations[stat] <= 0) {
      return;
    }

    allocations[stat]--;
  }

  function addBonusLevel(id: HeroId) {
    if (id in FIXED_LEVEL_HEROES) {
      return;
    }

    const currentBonus = getBonusLevel(id);

    if (currentBonus >= MAX_BONUS_LEVEL_PER_HERO) {
      return;
    }

    if (bonusLevelsUsed.value >= MAX_BONUS_POINTS) {
      return;
    }

    heroBonusLevels.value[id] = currentBonus + 1;
  }

  function resetAllBonusLevels() {
    heroBonusLevels.value = {};
  }

  function resetHeroLevelUp(id: HeroId) {
    delete heroLevelUps.value[id];
    delete heroBonusLevels.value[id];
  }

  // Watch episode choices and clear data when heroes are cut/not hired
  watch(episodeSetup.ep3Cut, resetHeroLevelUp);

  watch(episodeSetup.ep4Hire, (newHire) => {
    for (const heroId of EP4_HIRE_OPTIONS) {
      if (heroId !== newHire) {
        resetHeroLevelUp(heroId);
      }
    }
  });

  return {
    getStatAllocations,
    getLevelUpPointsUsed,

    getBonusLevel,
    bonusLevelsUsed,
    addBonusLevel,
    resetAllBonusLevels,

    statUp,
    statDown,

    resetHeroLevelUp
  };
}
