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

  function isEp8Recruit(id: HeroId): boolean {
    if (id === 'blonde-blazer') {
      return true;
    }

    if (EP4_HIRE_OPTIONS.includes(id as (typeof EP4_HIRE_OPTIONS)[number])) {
      return id !== ep4Hire.value;
    }

    return false;
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

  const synergyPairDefs = computed((): [HeroId, HeroId][] => {
    const pairs: [HeroId, HeroId][] = BASE_SYNERGY_PAIRS.map((pair) => [
      pair.hero1,
      pair.hero2
    ]);

    // Determine which conditional pair to use based on episode choices
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

    for (const [topId, bottomId] of synergyPairDefs.value) {
      const top = heroMap.get(topId);
      const bottom = heroMap.get(bottomId);

      if (top && bottom) {
        pairs.push({ topId, top, bottom });
      }
    }

    return pairs;
  });

  const ep8RecruitHeroes = computed(() => {
    if (!showEp8Recruits.value) {
      return [];
    }

    const pairHeroIds = new Set<string>(synergyPairDefs.value.flat());

    return visibleHeroes.value.filter((h) => !pairHeroIds.has(h.id));
  });

  return {
    ep3Cut,
    ep4Hire,
    showEp8Recruits,
    isEp8Recruit,
    ep3CutItems,
    ep4HireItems,
    visibleHeroes,
    synergyPairDefs,
    synergyPairColumns,
    ep8RecruitHeroes
  };
}
