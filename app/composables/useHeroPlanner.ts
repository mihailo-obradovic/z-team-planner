import {
  EP3_CUT_OPTIONS,
  EP4_HIRE_OPTIONS,
  FIXED_LEVEL_HEROES,
  MAX_LEVEL_UPS,
  MAX_STAT_VALUE,
  STAT_NAMES
} from '~/types/hero';
import type { HeroId, HeroStats, StatName } from '~/types/hero';

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

  function getStatBonuses(id: HeroId): HeroStats {
    return heroLevelUps.value[id] ?? ZERO_STATS;
  }

  function totalAssigned(id: HeroId): number {
    const bonuses = getStatBonuses(id);
    return STAT_NAMES.reduce((sum, s) => sum + bonuses[s], 0);
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
    ep3CutItems,
    ep4HireItems,
    visibleHeroes
  };
}
