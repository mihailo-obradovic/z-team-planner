import {
  DEFAULT_EP3_CUT,
  DEFAULT_EP4_HIRE,
  EP3_CUT_OPTIONS,
  EP4_HIRE_OPTIONS,
  EP8_ALWAYS_RECRUITED,
  BASE_SYNERGY_PAIRS,
  CONDITIONAL_SYNERGY_PAIRS,
  HEROES
} from '@/types/hero';

import type { HeroId } from '@/types/hero';

export function useHeroEpisodeSetup() {
  const ep3Cut = useState<HeroId>('ep3Cut', () => DEFAULT_EP3_CUT);
  const ep4Hire = useState<HeroId>('ep4Hire', () => DEFAULT_EP4_HIRE);
  const showEp8Recruits = useState('showEp8Recruits', () => false);

  const ep3CutItems = computed(() =>
    HEROES.filter((hero) =>
      (EP3_CUT_OPTIONS as readonly HeroId[]).includes(hero.id)
    ).map((hero) => ({ label: hero.name, value: hero.id }))
  );

  const ep4HireItems = computed(() =>
    HEROES.filter((hero) =>
      (EP4_HIRE_OPTIONS as readonly HeroId[]).includes(hero.id)
    ).map((hero) => ({ label: hero.name, value: hero.id }))
  );

  // * Who joins in episode 8 is exactly who cannot be trained (glossary, Trainable), so the cards shown and the training gates can never disagree.
  const ep8RecruitIds = computed<Set<HeroId>>(() => {
    const ids = new Set<HeroId>(EP8_ALWAYS_RECRUITED);

    for (const id of EP4_HIRE_OPTIONS) {
      if (id !== ep4Hire.value) {
        ids.add(id);
      }
    }

    return ids;
  });

  const visibleHeroes = computed(() =>
    HEROES.filter((hero) => {
      if (hero.id === ep3Cut.value) {
        return false;
      }

      if (ep8RecruitIds.value.has(hero.id)) {
        return showEp8Recruits.value;
      }

      return true;
    })
  );

  const ep8Recruits = computed(() =>
    visibleHeroes.value.filter((hero) => ep8RecruitIds.value.has(hero.id))
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
    const heroMap = new Map(visibleHeroes.value.map((hero) => [hero.id, hero]));

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

    // * Exposed so feature 005's agreement test asks the app which heroes are drivable instead of keeping its own copy of the rule.
    visibleHeroes,

    // * The mission simulator's synergy gate (feature 015) asks about ids, not cards, so the raw pairs are exposed beside the resolved columns.
    synergyPairs,
    synergyPairColumns
  };
}
