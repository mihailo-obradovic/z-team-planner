import { FIXED_LEVEL_HEROES, HEROES } from '@/types/hero';

import type { Hero, HeroId } from '@/types/hero';

type HeroPlanner = ReturnType<typeof createHeroPlanner>;

// * Cached on the Nuxt app, so its computeds and watchers exist once however many components ask.
export function useHeroPlanner(): HeroPlanner {
  const nuxtApp = useNuxtApp() as { _heroPlanner?: HeroPlanner };

  return (nuxtApp._heroPlanner ??= createHeroPlanner());
}

function createHeroPlanner() {
  const episodeSetup = useHeroEpisodeSetup();
  const levelUp = useHeroLevelUp(episodeSetup);
  const powerTraining = useHeroPowerTraining(episodeSetup, levelUp);
  const flightTraining = useHeroFlightTraining(episodeSetup, powerTraining);
  const missionSimulator = useMissionSimulator(
    episodeSetup,
    levelUp,
    powerTraining
  );

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
    heroes: ref<Hero[]>(HEROES),
    ...episodeSetup,
    ...levelUp,
    ...powerTraining,
    ...flightTraining,
    ...missionSimulator,
    resetHero,
    resetAllTrainings
  };
}
