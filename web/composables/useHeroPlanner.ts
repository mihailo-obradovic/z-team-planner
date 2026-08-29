import { FIXED_LEVEL_HEROES, HEROES } from '@/types/hero';

import type { Hero, HeroId } from '@/types/hero';

// * Singleton composable for hero planning. Uses useNuxtApp to cache the instance and prevent duplicate computeds/watchers.
export function useHeroPlanner() {
  const nuxtApp = useNuxtApp();

  // * Cache the composable instance to avoid duplicate computeds and watchers
  if (!(nuxtApp as any)._heroPlanner) {
    (nuxtApp as any)._heroPlanner = createHeroPlanner();
  }

  return (nuxtApp as any)._heroPlanner as ReturnType<typeof createHeroPlanner>;
}

// * Main hero planner composable that aggregates all hero management functionality. Acts as a unified interface for episode setup, level-ups, powers, and flight training.
function createHeroPlanner() {
  // * A constant, not a fetch: the roster ships with the app. Still a ref because every sub-composable takes one.
  const heroes = ref<Hero[]>(HEROES);

  // * Initialize all sub-composables with explicit dependencies
  const episodeSetup = useHeroEpisodeSetup(heroes);
  const levelUp = useHeroLevelUp(heroes, episodeSetup);
  const powerTraining = useHeroPowerTraining(heroes, episodeSetup, levelUp);
  const flightTraining = useHeroFlightTraining(episodeSetup, powerTraining);

  function resetHero(id: HeroId) {
    if (id in FIXED_LEVEL_HEROES) {
      return;
    }

    levelUp.resetHeroLevelUp(id);
    powerTraining.resetHeroPowers(id);
    flightTraining.resetHeroFlight(id);
  }

  function resetAllTrainings() {
    powerTraining.resetAllPowerTrainings();
    flightTraining.resetAllFlightTrainings();
    levelUp.resetAllBonusLevels();
  }

  return {
    heroes,
    ...episodeSetup,
    ...levelUp,
    ...powerTraining,
    ...flightTraining,
    resetHero,
    resetAllTrainings
  };
}
