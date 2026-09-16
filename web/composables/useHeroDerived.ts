import {
  FIXED_LEVEL_HEROES,
  HERO_FLIGHT,
  HERO_FLIGHT_CAPABILITY,
  MAX_BONUS_POINTS,
  MAX_FLIGHT_TRAININGS,
  MAX_LEVEL_UPS
} from '@/types/hero';
import { isFlightTrainable } from '@/utils/isFlightTrainable';

import type { Hero, HeroId, HeroStats, StatName } from '@/types/hero';

const NO_ALLOCATIONS: HeroStats = {
  combat: 0,
  intellect: 0,
  vigor: 0,
  charisma: 0,
  mobility: 0
};

// * The one read of a hero for both surfaces that show it, the card and the detail dialog, so the two can never disagree.
// * Every value has an answer for a `null` id, the closed dialog, so only `hero` itself needs narrowing.
export function useHeroDerived(heroId: MaybeRefOrGetter<HeroId | null>) {
  const {
    heroes,
    getStatAllocations,
    getLevelUpPointsUsed,
    getBonusLevel,
    bonusLevelsUsed,
    getPowerState,
    resolveDisplayStat,
    flyingHeroIds,
    flightTrainingsUsed
  } = useHeroPlanner();

  const id = computed(() => toValue(heroId));

  const hero = computed<Hero | null>(
    () => heroes.value.find((candidate) => candidate.id === id.value) ?? null
  );

  const statBonuses = computed(() =>
    id.value ? getStatAllocations(id.value) : NO_ALLOCATIONS
  );

  const levelUpPointsUsed = computed(() =>
    id.value ? getLevelUpPointsUsed(id.value) : 0
  );

  const bonusLevel = computed(() => (id.value ? getBonusLevel(id.value) : 0));

  const pointsRemaining = computed(
    () => MAX_LEVEL_UPS + bonusLevel.value - levelUpPointsUsed.value
  );

  const bonusFull = computed(() => bonusLevelsUsed.value >= MAX_BONUS_POINTS);

  const canLevelUp = computed(
    () => !!id.value && !(id.value in FIXED_LEVEL_HEROES)
  );

  const heroLevel = computed(() => {
    if (!id.value) {
      return 0;
    }

    const fixedLevel =
      FIXED_LEVEL_HEROES[id.value as keyof typeof FIXED_LEVEL_HEROES];

    if (fixedLevel !== undefined) {
      return fixedLevel;
    }

    // * A bonus level raises the cap, not the level; counting it would jump the level before the extra point is spent.
    return 1 + levelUpPointsUsed.value;
  });

  const flightActive = computed(
    () => !!id.value && flyingHeroIds.value.has(id.value)
  );

  const flightInfo = computed(
    () =>
      (id.value
        ? HERO_FLIGHT[id.value as keyof typeof HERO_FLIGHT]
        : undefined) ?? null
  );

  // * Phenomaman on Heavily Medicated does not have a disabled flight — he has no flight. Every other flier's glyph is a state the card can show as off.
  const flightShown = computed(() => {
    const capability =
      HERO_FLIGHT_CAPABILITY[id.value as keyof typeof HERO_FLIGHT_CAPABILITY];

    if (capability?.type !== 'conditional-power') {
      return true;
    }

    return flightActive.value;
  });

  const flightLocked = computed(() => {
    if (!id.value || !isFlightTrainable(id.value)) {
      return true;
    }

    return (
      !flightActive.value && flightTrainingsUsed.value >= MAX_FLIGHT_TRAININGS
    );
  });

  const hasPowers = computed(() => {
    if (!id.value) {
      return false;
    }

    const powerState = getPowerState(id.value);

    return powerState.startingRevealed || powerState.trainableSelected > 0;
  });

  // * Sonar's stats are read under whichever form is active, so the stat a row displays is not always the stat it is named after.
  function resolvedStat(stat: StatName): StatName {
    return id.value ? resolveDisplayStat(id.value, stat) : stat;
  }

  return {
    hero,
    statBonuses,
    levelUpPointsUsed,
    bonusLevel,
    pointsRemaining,
    bonusFull,
    canLevelUp,
    heroLevel,
    flightActive,
    flightInfo,
    flightShown,
    flightLocked,
    hasPowers,
    resolvedStat
  };
}
