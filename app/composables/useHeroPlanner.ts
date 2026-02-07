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
  STAT_NAMES
} from '~/types/hero';
import type { HeroId, HeroPowerState, HeroStats, StatName } from '~/types/hero';

const ZERO_STATS: HeroStats = Object.fromEntries(
  STAT_NAMES.map((s) => [s, 0])
) as HeroStats;

export function useHeroPlanner() {
  const { data: heroes } = useFetch('/api/heroes');

  const ep3Cut = useState<HeroId>('ep3Cut', () => 'sonar');
  const ep4Hire = useState<HeroId>('ep4Hire', () => 'waterboy');
  const showEp8Recruits = useState('showEp8Recruits', () => false);

  const heroLevelUps = useState<Partial<Record<HeroId, HeroStats>>>(
    'heroLevelUps',
    () => ({})
  );

  const heroPowers = useState<Partial<Record<HeroId, HeroPowerState>>>(
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

  const DEFAULT_POWER_STATE: HeroPowerState = [false, false, false];

  function getPowerState(id: HeroId): HeroPowerState {
    return heroPowers.value[id] ?? DEFAULT_POWER_STATE;
  }

  const trainingsUsed = computed(() => {
    return Object.values(heroPowers.value).filter(
      (p) => p && (p[1] || p[2])
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
    if (!heroPowers.value[id]) heroPowers.value[id] = [false, false, false];
    const powers = heroPowers.value[id]!;

    if (index === 0) {
      if (powers[0] && (powers[1] || powers[2])) return;
      powers[0] = !powers[0];
    } else {
      if (isEp8Recruit(id)) return;
      if (powers[index]) {
        powers[index] = false;
      } else {
        if (!powers[1] && !powers[2] && trainingsUsed.value >= MAX_POWER_TRAININGS) return;
        powers[index === 1 ? 2 : 1] = false;
        powers[index] = true;
        powers[0] = true;
      }
    }
  }

  const heroFlights = useState<Partial<Record<HeroId, boolean>>>(
    'heroFlights',
    () => ({})
  );

  function getFlightState(id: HeroId): boolean {
    if (!HERO_FLIGHT[id]) return false;
    if (id === 'blonde-blazer') return true;
    if (id === 'phenomaman') return !getPowerState(id)[1];
    return heroFlights.value[id] ?? false;
  }

  const flightTrainingsUsed = computed(() => {
    return FLIGHT_SCHOOL_HEROES.filter(
      (id) => heroFlights.value[id]
    ).length;
  });

  function toggleFlight(id: HeroId) {
    if (id === 'blonde-blazer' || id === 'phenomaman') return;
    if (!HERO_FLIGHT[id]) return;
    if (!heroFlights.value[id] && flightTrainingsUsed.value >= MAX_FLIGHT_TRAININGS) return;
    heroFlights.value[id] = !(heroFlights.value[id] ?? false);
  }

  function statUp(id: HeroId, stat: StatName) {
    if (id in FIXED_LEVEL_HEROES) return;
    const hero = heroes.value?.find((h) => h.id === id);
    if (!hero) return;

    if (!heroLevelUps.value[id]) heroLevelUps.value[id] = { ...ZERO_STATS };
    const bonuses = heroLevelUps.value[id]!;

    if (totalAssigned(id) >= MAX_LEVEL_UPS) return;
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

  watch(ep3Cut, (newCut) => {
    delete heroPowers.value[newCut];
    delete heroFlights.value[newCut];
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
    getPowerState,
    togglePower,
    trainingsUsed,
    isEp8Recruit,
    getFlightState,
    toggleFlight,
    flightTrainingsUsed,
    ep3CutItems,
    ep4HireItems,
    visibleHeroes
  };
}
