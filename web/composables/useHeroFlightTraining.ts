import {
  EP4_HIRE_OPTIONS,
  FLIGHT_SCHOOL_HEROES,
  HERO_FLIGHT_CAPABILITY,
  MAX_FLIGHT_TRAININGS
} from '@/types/hero';

import type { HeroId } from '@/types/hero';

// * Composable for managing flight training. Handles flight state, training limits, and conditional flight logic.
export function useHeroFlightTraining(
  episodeSetup: ReturnType<typeof useHeroEpisodeSetup>,
  powerTraining: ReturnType<typeof useHeroPowerTraining>
) {
  const heroFlights = useState<Partial<Record<HeroId, boolean>>>(
    'heroFlights',
    () => ({})
  );

  const flightTrainingsUsed = computed(() => {
    return FLIGHT_SCHOOL_HEROES.filter((id) => heroFlights.value[id]).length;
  });

  const flyingHeroIds = computed<Set<HeroId>>(() => {
    const result = new Set<HeroId>();

    for (const key in HERO_FLIGHT_CAPABILITY) {
      const id = key as HeroId;
      const capability =
        HERO_FLIGHT_CAPABILITY[id as keyof typeof HERO_FLIGHT_CAPABILITY];

      // * A hero who arrives in episode 8 brings no trainable power with them, so nothing on the card can train or untrain them and a flier among them flies unconditionally. That is why Phenomaman's flight is conditional only while he is the episode 4 hire: Heavily Medicated is a power he can take just in that case.
      if (episodeSetup.untrainableIds.value.has(id)) {
        result.add(id);
        continue;
      }

      switch (capability.type) {
        case 'innate':
          result.add(id);
          break;

        case 'conditional-power': {
          // * Phenomaman loses flight if "Heavily Medicated" (trainable-1) is selected
          const powerState = powerTraining.getPowerState(id);
          const hasPower = powerState.trainableSelected === 1;
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
    // * Only trainable heroes can toggle flight
    if (!capability || capability.type !== 'trainable') {
      return;
    }

    // * Check training limit
    if (
      !heroFlights.value[id] &&
      flightTrainingsUsed.value >= MAX_FLIGHT_TRAININGS
    ) {
      return;
    }

    heroFlights.value[id] = !(heroFlights.value[id] ?? false);
  }

  function resetAllFlightTrainings() {
    heroFlights.value = {};
  }

  function resetHeroFlight(id: HeroId) {
    delete heroFlights.value[id];
  }

  // * Watch episode choices and clear flight data when heroes are cut/not hired
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
