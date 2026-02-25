import {
  EP3_CUT_OPTIONS,
  EP4_HIRE_OPTIONS,
  BASE_SYNERGY_PAIRS,
  CONDITIONAL_SYNERGY_PAIRS
} from '@/types/hero';
import type { Hero, HeroId } from '@/types/hero';

/**
 * Composable for managing episode choices and hero visibility.
 * Handles episode 3 cut, episode 4 hire, and episode 8 recruits.
 */
export function useHeroEpisodeSetup(heroes: Ref<Hero[] | null | undefined>) {
  const ep3Cut = useState<HeroId>('ep3Cut', () => 'sonar');
  const ep4Hire = useState<HeroId>('ep4Hire', () => 'waterboy');
  const showEp8Recruits = useState('showEp8Recruits', () => false);

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

  const ep8RecruitIds = computed<Set<HeroId>>(() => {
    const ids = new Set<HeroId>(['blonde-blazer'] as HeroId[]);

    for (const id of EP4_HIRE_OPTIONS) {
      if (id !== ep4Hire.value) ids.add(id as HeroId);
    }

    return ids;
  });

  const visibleHeroes = computed(
    () =>
      heroes.value?.filter((hero) => {
        if (hero.id === ep3Cut.value) {
          return false;
        }

        if (hero.id === 'blonde-blazer') {
          return showEp8Recruits.value;
        }

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

  const ep8Recruits = computed(() =>
    visibleHeroes.value.filter((h) => ep8RecruitIds.value.has(h.id))
  );

  const synergyPairs = computed((): [HeroId, HeroId][] => {
    const pairs: [HeroId, HeroId][] = BASE_SYNERGY_PAIRS.map((pair) => [
      pair.hero1,
      pair.hero2
    ]);

    const conditionalKey =
      `${ep3Cut.value}-cut-${ep4Hire.value}-hired` as keyof typeof CONDITIONAL_SYNERGY_PAIRS;

    if (conditionalKey in CONDITIONAL_SYNERGY_PAIRS) {
      const conditionalPair = CONDITIONAL_SYNERGY_PAIRS[conditionalKey];

      pairs.push([conditionalPair.hero1, conditionalPair.hero2]);
    }

    return pairs;
  });

  const synergyPairColumns = computed(() => {
    const heroMap = new Map(visibleHeroes.value.map((h) => [h.id, h]));

    const pairs = [];

    for (const [topId, bottomId] of synergyPairs.value) {
      const top = heroMap.get(topId);
      const bottom = heroMap.get(bottomId);

      if (top && bottom) {
        pairs.push({ topId, top, bottom });
      }
    }

    return pairs;
  });

  return {
    ep3Cut,
    ep3CutItems,

    ep4Hire,
    ep4HireItems,

    ep8RecruitIds,
    ep8Recruits,
    showEp8Recruits,

    synergyPairColumns
  };
}
