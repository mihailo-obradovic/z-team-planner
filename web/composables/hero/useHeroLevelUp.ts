import {
  EP4_HIRE_OPTIONS,
  FIXED_LEVEL_HEROES,
  HERO_STARTING_STATS,
  MAX_LEVEL_UPS,
  MAX_STAT_VALUE,
  MAX_BONUS_POINTS,
  MAX_BONUS_LEVEL_PER_HERO,
  STAT_NAMES
} from '@/types/hero';

import type { HeroId, HeroStats, StatName } from '@/types/hero';

const ZERO_STATS: HeroStats = Object.fromEntries(
  STAT_NAMES.map((stat) => [stat, 0])
) as HeroStats;

export function useHeroLevelUp(
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

    return STAT_NAMES.reduce((sum, stat) => sum + allocations[stat], 0);
  }

  function getBonusLevel(id: HeroId): number {
    return heroBonusLevels.value[id] ?? 0;
  }

  const bonusLevelsUsed = computed(() =>
    Object.values(heroBonusLevels.value).reduce(
      (sum, level) => sum + (level ?? 0),
      0
    )
  );

  function statUp(id: HeroId, stat: StatName) {
    if (id in FIXED_LEVEL_HEROES) {
      return;
    }

    const allocations = (heroLevelUps.value[id] ??= { ...ZERO_STATS });

    if (getLevelUpPointsUsed(id) >= MAX_LEVEL_UPS + getBonusLevel(id)) {
      return;
    }

    if (HERO_STARTING_STATS[id][stat] + allocations[stat] >= MAX_STAT_VALUE) {
      return;
    }

    allocations[stat]++;
  }

  function statDown(id: HeroId, stat: StatName) {
    if (id in FIXED_LEVEL_HEROES) {
      return;
    }

    const allocations = heroLevelUps.value[id];

    if (!allocations || allocations[stat] <= 0) {
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

  // ! A bonus level is a point to spend, so returning it has to unspend it: leaving the allocation behind puts the hero over the cap and the API rejects the whole build on save.
  function trimToLevelUpCap(id: HeroId) {
    const allocations = heroLevelUps.value[id];

    if (!allocations) {
      return;
    }

    let excess = getLevelUpPointsUsed(id) - (MAX_LEVEL_UPS + getBonusLevel(id));

    while (excess > 0) {
      // * Take from the tallest stat, ties going to the first in STAT_NAMES, so the same reset always trims the same way.
      let tallest: StatName = STAT_NAMES[0];

      for (const stat of STAT_NAMES) {
        if (allocations[stat] > allocations[tallest]) {
          tallest = stat;
        }
      }

      allocations[tallest]--;
      excess--;
    }
  }

  function resetAllBonusLevels() {
    heroBonusLevels.value = {};

    for (const id of Object.keys(heroLevelUps.value) as HeroId[]) {
      trimToLevelUpCap(id);
    }
  }

  function resetHeroLevelUp(id: HeroId) {
    delete heroLevelUps.value[id];
    delete heroBonusLevels.value[id];
  }

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
