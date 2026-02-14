import type { HeroId, HeroStats } from '~~/app/types/hero';

interface BaseHero {
  id: HeroId;
  name: string;
  startingStats: HeroStats;
}

const heroes: BaseHero[] = [
  {
    id: 'coupe',
    name: 'Coupé',
    startingStats: {
      combat: 4,
      intellect: 3,
      vigor: 1,
      charisma: 1,
      mobility: 3
    }
  },
  {
    id: 'flambae',
    name: 'Flambae',
    startingStats: {
      combat: 4,
      intellect: 1,
      vigor: 2,
      charisma: 2,
      mobility: 3
    }
  },
  {
    id: 'golem',
    name: 'Golem',
    startingStats: {
      combat: 3,
      intellect: 1,
      vigor: 4,
      charisma: 2,
      mobility: 2
    }
  },
  {
    id: 'invisigal',
    name: 'Invisigal',
    startingStats: {
      combat: 3,
      intellect: 2,
      vigor: 2,
      charisma: 1,
      mobility: 3
    }
  },
  {
    id: 'malevola',
    name: 'Malevola',
    startingStats: {
      combat: 3,
      intellect: 2,
      vigor: 2,
      charisma: 3,
      mobility: 2
    }
  },
  {
    id: 'phenomaman',
    name: 'Phenomaman',
    startingStats: {
      combat: 7,
      intellect: 1,
      vigor: 7,
      charisma: 2,
      mobility: 6
    }
  },
  {
    id: 'prism',
    name: 'Prism',
    startingStats: {
      combat: 4,
      intellect: 2,
      vigor: 1,
      charisma: 4,
      mobility: 1
    }
  },
  {
    id: 'punch-up',
    name: 'Punch Up',
    startingStats: {
      combat: 3,
      intellect: 1,
      vigor: 4,
      charisma: 3,
      mobility: 1
    }
  },
  {
    id: 'sonar',
    name: 'Sonar',
    startingStats: {
      combat: 2,
      intellect: 4,
      vigor: 1,
      charisma: 3,
      mobility: 2
    }
  },
  {
    id: 'waterboy',
    name: 'Waterboy',
    startingStats: {
      combat: 1,
      intellect: 2,
      vigor: 2,
      charisma: 1,
      mobility: 2
    }
  },
  {
    id: 'blonde-blazer',
    name: 'Blonde Blazer',
    startingStats: {
      combat: 8,
      intellect: 7,
      vigor: 8,
      charisma: 6,
      mobility: 7
    }
  }
];

export default defineEventHandler(() => {
  return heroes;
});
