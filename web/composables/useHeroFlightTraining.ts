import {
  EP4_HIRE_OPTIONS,
  FLIGHT_SCHOOL_HEROES,
  HERO_FLIGHT_CAPABILITY,
  MAX_FLIGHT_TRAININGS
} from '@/types/hero';

import type { HeroId } from '@/types/hero';

export function useHeroFlightTraining(
  episodeSetup: ReturnType<typeof useHeroEpisodeSetup>,
  powerTraining: ReturnType<typeof useHeroPowerTraining>
) {
  const heroFlights = useState<Partial<Record<HeroId, boolean>>>(
    'heroFlights',
    () => ({})
  );

  const flightTrainingsUsed = computed(
    () => FLIGHT_SCHOOL_HEROES.filter((id) => heroFlights.value[id]).length
  );

  const flyingHeroIds = computed<Set<HeroId>>(() => {
    const result = new Set<HeroId>();

    for (const [key, capability] of Object.entries(HERO_FLIGHT_CAPABILITY)) {
      const id = key as HeroId;

      // * An episode 8 recruit brings no trainable power, so nothing can untrain a flier among them; that is also why Phenomaman's flight is conditional only as the episode 4 hire.
      if (episodeSetup.ep8RecruitIds.value.has(id)) {
        result.add(id);
        continue;
      }

      switch (capability.type) {
        case 'innate':
          result.add(id);
          break;

        case 'conditional-power': {
          const hasPower =
            powerTraining.getPowerState(id).trainableSelected === 1;

          if (capability.inverted ? !hasPower : hasPower) {
            result.add(id);
          }
          break;
        }

        case 'trainable':
          if (heroFlights.value[id]) {
            result.add(id);
          }
          break;
      }
    }

    return result;
  });

  function toggleFlight(id: HeroId) {
    const capability =
      HERO_FLIGHT_CAPABILITY[id as keyof typeof HERO_FLIGHT_CAPABILITY];

    if (capability?.type !== 'trainable') {
      return;
    }

    if (
      !heroFlights.value[id] &&
      flightTrainingsUsed.value >= MAX_FLIGHT_TRAININGS
    ) {
      return;
    }

    heroFlights.value[id] = !heroFlights.value[id];
  }

  function resetAllFlightTrainings() {
    heroFlights.value = {};
  }

  function resetHeroFlight(id: HeroId) {
    delete heroFlights.value[id];
  }

  watch(episodeSetup.ep3Cut, (newCut) => {
    delete heroFlights.value[newCut];
  });

  watch(episodeSetup.ep4Hire, (newHire) => {
    for (const heroId of EP4_HIRE_OPTIONS) {
      if (heroId !== newHire) {
        delete heroFlights.value[heroId];
      }
    }
  });

  return {
    flightTrainingsUsed,
    flyingHeroIds,
    toggleFlight,
    resetAllFlightTrainings,
    resetHeroFlight
  };
}
