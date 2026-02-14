import {
  EP4_HIRE_OPTIONS,
  FLIGHT_SCHOOL_HEROES,
  HERO_FLIGHT_CAPABILITY,
  MAX_FLIGHT_TRAININGS
} from '@/types/hero';
import type { HeroId } from '@/types/hero';
import type { useHeroEpisodeSetup } from './useHeroEpisodeSetup';
import type { useHeroPowerTraining } from './useHeroPowerTraining';

/**
 * Composable for managing flight training.
 * Handles flight state, training limits, and conditional flight logic.
 */
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

  function getFlightState(id: HeroId): boolean {
    const capability =
      HERO_FLIGHT_CAPABILITY[id as keyof typeof HERO_FLIGHT_CAPABILITY];

    if (!capability) {
      return false;
    }

    switch (capability.type) {
      case 'innate':
        // Always can fly (e.g., Blonde Blazer)
        return true;

      case 'conditional-power': {
        // Flight depends on power selection (e.g., Phenomaman)
        // Phenomaman loses flight if "Heavily Medicated" (trainable-1) is selected
        const powerState = powerTraining.getPowerState(id);
        const hasPower = powerState.trainableSelected === 1;

        // If inverted, flight is disabled when power is selected
        return capability.inverted ? !hasPower : hasPower;
      }

      case 'trainable':
        // Must train at Flight School (e.g., Coupe, Flambae, Sonar)
        return heroFlights.value[id] ?? false;

      default:
        return false;
    }
  }

  function toggleFlight(id: HeroId) {
    const capability =
      HERO_FLIGHT_CAPABILITY[id as keyof typeof HERO_FLIGHT_CAPABILITY];
    // Only trainable heroes can toggle flight
    if (!capability || capability.type !== 'trainable') return;

    // Check training limit
    if (
      !heroFlights.value[id] &&
      flightTrainingsUsed.value >= MAX_FLIGHT_TRAININGS
    )
      return;

    heroFlights.value[id] = !(heroFlights.value[id] ?? false);
  }

  function resetAllFlightTrainings() {
    heroFlights.value = {};
  }

  function clearHeroFlight(id: HeroId) {
    delete heroFlights.value[id];
  }

  // Watch episode choices and clear flight data when heroes are cut/not hired
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
    heroFlights,
    getFlightState,
    toggleFlight,
    flightTrainingsUsed,
    resetAllFlightTrainings,
    clearHeroFlight
  };
}
