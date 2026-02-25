import { FIXED_LEVEL_HEROES } from '@/types/hero';
import { useHeroEpisodeSetup } from './useHeroEpisodeSetup';
import { useHeroFlightTraining } from './useHeroFlightTraining';
import { useHeroLevelUp } from './useHeroLevelUp';
import { useHeroPowerTraining } from './useHeroPowerTraining';
import type { HeroId } from '@/types/hero';

/**
 * Main hero planner composable that aggregates all hero management functionality.
 * Acts as a unified interface for episode setup, level-ups, powers, and flight training.
 */
function createHeroPlanner() {
  const { data: heroes } = useFetch('/api/heroes');

  // Initialize all sub-composables with explicit dependencies
  const episodeSetup = useHeroEpisodeSetup(heroes);
  const levelUp = useHeroLevelUp(heroes, episodeSetup);
  const powerTraining = useHeroPowerTraining(heroes, episodeSetup, levelUp);
  const flightTraining = useHeroFlightTraining(episodeSetup, powerTraining);

  // Cross-cutting concern: resetHero clears all state for a specific hero
  function resetHero(id: HeroId) {
    if (id in FIXED_LEVEL_HEROES) {
      return;
    }

    levelUp.resetHeroLevelUp(id);
    powerTraining.resetHeroPowers(id);
    flightTraining.resetHeroFlight(id);
  }

  // Return unified API by spreading all sub-composable exports
  return {
    heroes,
    ...episodeSetup,
    ...levelUp,
    ...powerTraining,
    ...flightTraining,
    resetHero
  };
}

/**
 * Singleton composable for hero planning.
 * Uses useNuxtApp to cache the instance and prevent duplicate computeds/watchers.
 */
export function useHeroPlanner() {
  const nuxtApp = useNuxtApp();

  // Cache the composable instance to avoid duplicate computeds and watchers
  if (!(nuxtApp as any)._heroPlanner) {
    (nuxtApp as any)._heroPlanner = createHeroPlanner();
  }

  return (nuxtApp as any)._heroPlanner as ReturnType<typeof createHeroPlanner>;
}
