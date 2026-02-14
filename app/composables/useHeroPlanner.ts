import {
  EP3_CUT_OPTIONS,
  EP4_HIRE_OPTIONS,
  FIXED_LEVEL_HEROES,
  FLIGHT_SCHOOL_HEROES,
  HERO_FLIGHT,
  MAX_FLIGHT_TRAININGS,
  MAX_LEVEL_UPS,
  MAX_POWER_TRAININGS,
  MAX_STAT_VALUE,
  MAX_BONUS_POINTS,
  STAT_NAMES
} from '~/types/hero';
import type { HeroId, HeroPowerSelection, HeroStats, StatName } from '~/types/hero';

const ZERO_STATS: HeroStats = Object.fromEntries(
  STAT_NAMES.map((s) => [s, 0])
) as HeroStats;

function createHeroPlanner() {
  const { data: heroes } = useFetch('/api/heroes');

  const ep3Cut = useState<HeroId>('ep3Cut', () => 'sonar');
  const ep4Hire = useState<HeroId>('ep4Hire', () => 'waterboy');
  const showEp8Recruits = useState('showEp8Recruits', () => false);

  const heroLevelUps = useState<Partial<Record<HeroId, HeroStats>>>(
    'heroLevelUps',
    () => ({})
  );

  const heroPowers = useState<Partial<Record<HeroId, HeroPowerSelection>>>(
    'heroPowers',
    () => ({})
  );

  function getStatBonuses(id: HeroId): HeroStats {
    return heroLevelUps.value[id] ?? ZERO_STATS;
  }

  function totalAssigned(id: HeroId): number {
    const bonuses = getStatBonuses(id);
    return STAT_NAMES.reduce((sum, s) => sum + bonuses[s], 0);
  }

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

  function isEp8Recruit(id: HeroId): boolean {
    if (id === 'blonde-blazer') return true;
    if (EP4_HIRE_OPTIONS.includes(id as (typeof EP4_HIRE_OPTIONS)[number])) {
      return id !== ep4Hire.value;
    }
    return false;
  }

  function togglePower(id: HeroId, index: 0 | 1 | 2) {
    if (!heroPowers.value[id]) {
      heroPowers.value[id] = {
        startingRevealed: false,
        trainableSelected: 0
      };
    }
    const powers = heroPowers.value[id]!;

    if (index === 0) {
      // Toggle starting power (only if no trainable is selected)
      if (powers.startingRevealed && powers.trainableSelected > 0) return;
      powers.startingRevealed = !powers.startingRevealed;
    } else {
      // Toggle trainable power (1 or 2)
      if (isEp8Recruit(id)) return;

      if (powers.trainableSelected === index) {
        // Deselect current trainable
        powers.trainableSelected = 0;
      } else {
        // Check training limit
        if (
          powers.trainableSelected === 0 &&
          trainingsUsed.value >= MAX_POWER_TRAININGS
        )
          return;

        // Select new trainable (automatically deselects the other)
        powers.trainableSelected = index as 1 | 2;
        powers.startingRevealed = true; // Auto-reveal starting when selecting trainable
      }
    }
  }

  const heroFlights = useState<Partial<Record<HeroId, boolean>>>(
    'heroFlights',
    () => ({})
  );

  // Special power button states
  // For Flambae: boolean for Supernova activation
  // For Coupe: 0 = off, 1 = +combat, 2 = +mobility
  const heroSpecialPowers = useState<Partial<Record<HeroId, number>>>(
    'heroSpecialPowers',
    () => ({})
  );

  const heroBonusLevels = useState<Partial<Record<HeroId, number>>>(
    'heroBonusLevels',
    () => ({})
  );

  function getFlightState(id: HeroId): boolean {
    const flightInfo = HERO_FLIGHT[id as keyof typeof HERO_FLIGHT];
    if (!flightInfo) return false;
    if (id === 'blonde-blazer') return true;
    // Phenomaman loses flight if "Heavily Medicated" (trainable-1) is selected
    if (id === 'phenomaman') return getPowerState(id).trainableSelected !== 1;
    return heroFlights.value[id] ?? false;
  }

  const flightTrainingsUsed = computed(() => {
    return FLIGHT_SCHOOL_HEROES.filter((id) => heroFlights.value[id]).length;
  });

  function toggleFlight(id: HeroId) {
    if (id === 'blonde-blazer' || id === 'phenomaman') return;
    const flightInfo = HERO_FLIGHT[id as keyof typeof HERO_FLIGHT];
    if (!flightInfo) return;
    if (
      !heroFlights.value[id] &&
      flightTrainingsUsed.value >= MAX_FLIGHT_TRAININGS
    )
      return;
    heroFlights.value[id] = !(heroFlights.value[id] ?? false);
  }

  function statUp(id: HeroId, stat: StatName) {
    if (id in FIXED_LEVEL_HEROES) return;
    const hero = heroes.value?.find((h) => h.id === id);
    if (!hero) return;

    if (!heroLevelUps.value[id]) heroLevelUps.value[id] = { ...ZERO_STATS };
    const bonuses = heroLevelUps.value[id]!;

    const effectiveLevelCap = MAX_LEVEL_UPS + getBonusLevel(id);
    if (totalAssigned(id) >= effectiveLevelCap) return;
    if (hero.startingStats[stat] + bonuses[stat] >= MAX_STAT_VALUE) return;

    bonuses[stat]++;
  }

  function statDown(id: HeroId, stat: StatName) {
    if (id in FIXED_LEVEL_HEROES) return;
    if (!heroLevelUps.value[id]) return;
    const bonuses = heroLevelUps.value[id]!;

    if (bonuses[stat] <= 0) return;
    bonuses[stat]--;
  }

  function resetHero(id: HeroId) {
    if (id in FIXED_LEVEL_HEROES) return;
    delete heroLevelUps.value[id];
    delete heroPowers.value[id];
    delete heroFlights.value[id];
    delete heroSpecialPowers.value[id];
    delete heroBonusLevels.value[id];
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
    const specialState = getSpecialPowerState(id);

    if (id === 'flambae' && specialState === 1) {
      // Supernova active: set combat and mobility to 10
      if (stat === 'combat' || stat === 'mobility') {
        const hero = heroes.value?.find((h) => h.id === id);
        if (!hero) return 0;
        const normalBonus = getStatBonuses(id)[stat];
        return Math.max(
          0,
          MAX_STAT_VALUE - hero.startingStats[stat] - normalBonus
        );
      }
    } else if (id === 'coupe' && specialState > 0) {
      const powerStates = getPowerState(id);
      // À la Seconde is trainable-2, check if it's selected
      const isUpgraded = powerStates.trainableSelected === 2;
      const bonus = isUpgraded ? 3 : 1;

      if (specialState === 1 && stat === 'combat') return bonus;
      if (specialState === 2 && stat === 'mobility') return bonus;
    }

    return 0;
  }

  function resetAllPowerTrainings() {
    heroPowers.value = {};
    heroSpecialPowers.value = {};
  }

  function resetAllFlightTrainings() {
    heroFlights.value = {};
  }

  const bonusLevelsUsed = computed(() => {
    return Object.values(heroBonusLevels.value).reduce(
      (sum, v) => sum + (v ?? 0),
      0
    );
  });

  function getBonusLevel(id: HeroId): number {
    return heroBonusLevels.value[id] ?? 0;
  }

  function incrementBonusLevel(id: HeroId) {
    if (id in FIXED_LEVEL_HEROES) return;
    const currentBonus = getBonusLevel(id);
    if (currentBonus >= 4) return;
    if (bonusLevelsUsed.value >= MAX_BONUS_POINTS) return;
    heroBonusLevels.value[id] = currentBonus + 1;
  }

  function resetAllBonusLevels() {
    heroBonusLevels.value = {};
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

  watch(ep3Cut, (newCut) => {
    delete heroPowers.value[newCut];
    delete heroFlights.value[newCut];
    delete heroSpecialPowers.value[newCut];
    delete heroBonusLevels.value[newCut];
  });

  watch(ep4Hire, (newHire) => {
    for (const heroId of EP4_HIRE_OPTIONS) {
      if (heroId !== newHire) {
        delete heroPowers.value[heroId];
        delete heroFlights.value[heroId];
        delete heroSpecialPowers.value[heroId];
        delete heroBonusLevels.value[heroId];
      }
    }
  });

  const ep3CutItems = computed(
    () =>
      heroes.value
        ?.filter((h) =>
          EP3_CUT_OPTIONS.includes(h.id as (typeof EP3_CUT_OPTIONS)[number])
        )
        .map((h) => ({ label: h.name, value: h.id })) ?? []
  );

  const ep4HireItems = computed(
    () =>
      heroes.value
        ?.filter((h) =>
          EP4_HIRE_OPTIONS.includes(h.id as (typeof EP4_HIRE_OPTIONS)[number])
        )
        .map((h) => ({ label: h.name, value: h.id })) ?? []
  );

  const visibleHeroes = computed(
    () =>
      heroes.value?.filter((hero) => {
        if (hero.id === ep3Cut.value) return false;
        if (hero.id === 'blonde-blazer') return showEp8Recruits.value;
        if (
          EP4_HIRE_OPTIONS.includes(
            hero.id as (typeof EP4_HIRE_OPTIONS)[number]
          )
        ) {
          return hero.id === ep4Hire.value || showEp8Recruits.value;
        }
        return true;
      }) ?? []
  );

  return {
    heroes,
    ep3Cut,
    ep4Hire,
    showEp8Recruits,
    heroLevelUps,
    getStatBonuses,
    totalAssigned,
    statUp,
    statDown,
    resetHero,
    resetAllPowerTrainings,
    resetAllFlightTrainings,
    getPowerState,
    togglePower,
    trainingsUsed,
    isEp8Recruit,
    getFlightState,
    toggleFlight,
    flightTrainingsUsed,
    ep3CutItems,
    ep4HireItems,
    visibleHeroes,
    getSpecialPowerState,
    toggleSpecialPower,
    getSpecialPowerBonus,
    getSpecialPowerBonusStats,
    getBonusLevel,
    incrementBonusLevel,
    bonusLevelsUsed,
    resetAllBonusLevels
  };
}

export function useHeroPlanner() {
  const nuxtApp = useNuxtApp();

  // Cache the composable instance to avoid duplicate computeds and watchers
  if (!(nuxtApp as any)._heroPlanner) {
    (nuxtApp as any)._heroPlanner = createHeroPlanner();
  }

  return (nuxtApp as any)._heroPlanner as ReturnType<typeof createHeroPlanner>;
}
