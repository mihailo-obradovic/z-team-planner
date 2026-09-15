export type HeroId =
  | 'blonde-blazer'
  | 'coupe'
  | 'flambae'
  | 'golem'
  | 'invisigal'
  | 'malevola'
  | 'phenomaman'
  | 'prism'
  | 'punch-up'
  | 'sonar'
  | 'waterboy';

export const STAT_NAMES = [
  'combat',
  'intellect',
  'vigor',
  'charisma',
  'mobility'
] as const;

export type StatName = (typeof STAT_NAMES)[number];

export type HeroStats = Record<StatName, number>;

export const MAX_STAT_VALUE = 10;

export const EP3_CUT_OPTIONS = [
  'coupe',
  'sonar'
] as const satisfies readonly HeroId[];

export const EP4_HIRE_OPTIONS = [
  'phenomaman',
  'waterboy'
] as const satisfies readonly HeroId[];

// * Blonde Blazer joins in episode 8 whatever the player chose earlier, so she is a recruit in every build — unlike the episode 4 options, which are recruits only when not hired.
export const EP8_ALWAYS_RECRUITED = [
  'blonde-blazer'
] as const satisfies readonly HeroId[];

// * The planner's episode defaults — the values feature 001's serializer omits. Exported so the game-data export (feature 005) reads them from the one source rather than a copy.
export const DEFAULT_EP3_CUT: HeroId = 'sonar';
export const DEFAULT_EP4_HIRE: HeroId = 'waterboy';

export const FIXED_LEVEL_HEROES = {
  phenomaman: 12,
  'blonde-blazer': 20
} as const satisfies Partial<Record<HeroId, number>>;

export const MAX_LEVEL_UPS = 9;
export const MAX_BONUS_POINTS = 4;
export const MAX_BONUS_LEVEL_PER_HERO = 4;

export type HeroPowerDefinition = {
  name: string;
  description: string;
  slot: 'starting' | 'trainable-1' | 'trainable-2';
  // * Selecting this power upgrades the starting power rather than adding one.
  overridesStarting?: boolean;
};

// * The game's only two shapes: a starting power alone, for a hero who arrived in episode 8 with training behind her, or a starting power at index 0 plus two mutually exclusive trainable options.
export type HeroPowerSet =
  | [HeroPowerDefinition]
  | [HeroPowerDefinition, HeroPowerDefinition, HeroPowerDefinition];

export type HeroPowerSelection = {
  startingRevealed: boolean;
  // * 0 is no trainable power; 1 and 2 are the first and second options.
  trainableSelected: 0 | 1 | 2;
};

export const MAX_POWER_TRAININGS = 7;

export type FlightCapability =
  | { type: 'innate' }
  | {
      type: 'conditional-power';
      requiresPowerSlot: 'starting' | 'trainable-1' | 'trainable-2';
      // * The power removes flight instead of granting it.
      inverted?: boolean;
    }
  | { type: 'trainable' }
  | { type: 'none' };

export const FLIGHT_SCHOOL_HEROES = [
  'coupe',
  'flambae',
  'sonar'
] as const satisfies readonly HeroId[];

// * Every other hero's flight is settled by their own data — innate, power-driven, or absent — so no control on a card can toggle it.
export function isFlightTrainable(id: HeroId): boolean {
  return (FLIGHT_SCHOOL_HEROES as readonly HeroId[]).includes(id);
}

export const MAX_FLIGHT_TRAININGS = 2;

export const HERO_POWERS = {
  coupe: [
    {
      name: 'En Pointe',
      description:
        'In 2+ slots calls, if placed in the first slot, Coupé gains +1 Combat. If placed in the second slot, she gains +1 Mobility.',
      slot: 'starting'
    },
    {
      name: 'Pirouette',
      description:
        'If Coupé is sent on a call that fails, she will reattempt it.',
      slot: 'trainable-1'
    },
    {
      name: 'À la Seconde',
      description:
        'Upgrades En Pointe. If placed in the first slot, Coupé now gains +3 Combat. If placed in the second slot, she now gains +3 Mobility.',
      slot: 'trainable-2',
      overridesStarting: true
    }
  ],
  flambae: [
    {
      name: 'On Fire',
      description:
        'After success, Flambae gains +1 Combat and +1 Mobility. This effect stacks. All boosts reset after a failure.',
      slot: 'starting'
    },
    {
      name: 'Comet',
      description:
        'After a success, Flambae also reduces call completion and travel time. If after two successes Flambae fails a third, he is downed.',
      slot: 'trainable-1'
    },
    {
      name: 'Supernova',
      description:
        "Upgrades On Fire. Succeeding twice will set Flambae's Combat and Mobility to max and removes rest time. After a fail, stats drop to 1.",
      slot: 'trainable-2',
      overridesStarting: true
    }
  ],
  golem: [
    {
      name: 'Diamond in the Rough',
      description:
        "When Golem is in a call with 2+ slots, certain ones may grant +2 to a stat and -1 to others when he's assigned.",
      slot: 'starting'
    },
    {
      name: 'Spread Thin',
      description:
        'Golem expands to fill each empty slot, increasing his stats by 25% per slot up to 200% when beneficial.',
      slot: 'trainable-1'
    },
    {
      name: 'Found Himself',
      description:
        "Once per shift, all of Golem's stats can be reset within the hero Database, allowing for redistribution of points.",
      slot: 'trainable-2'
    }
  ],
  invisigal: [
    {
      name: 'Lone Wolf',
      description:
        'When sent alone, Invisigal reduces travel time and call completion time.',
      slot: 'starting'
    },
    {
      name: 'Ear to the Ground',
      description:
        'With her connections, Invisigal can reveal the number of slots and crime type on hover for certain calls before they happen.',
      slot: 'trainable-1'
    },
    {
      name: 'Wolf Pack',
      description: 'If Invisigal is on the team, XP rewards are doubled.',
      slot: 'trainable-2'
    }
  ],
  malevola: [
    {
      name: 'Life Trade',
      description:
        'Malevola heals one hero when sent on a call together. She then receives +1 Charisma or Vigor. This effect stacks.',
      slot: 'starting'
    },
    {
      name: 'Life Trade Visions',
      description:
        "After healing a hero, Malevola also reveals the stats of the next call she's assigned to.",
      slot: 'trainable-1'
    },
    {
      name: 'Portal Ritual',
      description:
        'After healing a hero, Malevola also creates a portal near the call once per shift. The portal lasts 45 seconds after call completion.',
      slot: 'trainable-2'
    }
  ],
  phenomaman: [
    {
      name: 'Easily Depressed',
      description:
        'Phenomaman needs only 2 seconds rest, however if any call fails or misses, he will be depressed and need 45 seconds of rest.',
      slot: 'starting'
    },
    {
      name: 'Heavily Medicated',
      description:
        'Upgrades Easily Depressed. Phenomaman loses his ability to fly and rests for 8 more seconds than usual, but no longer can become depressed.',
      slot: 'trainable-1',
      overridesStarting: true
    },
    {
      name: 'Phenomenal Motivation',
      description:
        'Heroes sent with Phenomaman have their rest time reduced by half if he completes the call with them.',
      slot: 'trainable-2'
    }
  ],
  prism: [
    {
      name: 'Doppelganger Illusion',
      description:
        'When assigned to a call, Prism duplicates the hero to her left, placing their illusion in an empty slot with half their stats.',
      slot: 'starting'
    },
    {
      name: 'Perfect Copy',
      description:
        "Upgrades Doppelganger Illusion. Prism's duplicated illusions now have the full stats of the copied hero.",
      slot: 'trainable-1',
      overridesStarting: true
    },
    {
      name: 'Long Range Illusion',
      description:
        'When a call is about to expire, Prism creates an illusion that keeps the call up for a few more seconds. This happens once per shift.',
      slot: 'trainable-2'
    }
  ],
  'punch-up': [
    {
      name: 'Hard Head',
      description:
        "Punch Up doesn't receive any debuffs from injuries. He cannot be downed.",
      slot: 'starting'
    },
    {
      name: 'Squeeze In',
      description:
        'On a call with <4 slots, Punch Up creates a slot exclusively for him to join.',
      slot: 'trainable-1'
    },
    {
      name: 'Harder Head',
      description:
        'While Punch Up is injured, he receives +2 Combat, +2 Vigor, and reduces rest time.',
      slot: 'trainable-2'
    }
  ],
  sonar: [
    {
      name: 'Instincts',
      description:
        'Sonar transforms after returning from a call. His Intellect swaps with Combat and his Charisma swaps with Vigor until the next call.',
      slot: 'starting'
    },
    {
      name: 'Bat Shit',
      description:
        'In Mega Bat form, Sonar is immune to injuries and his resting time is reduced by half.',
      slot: 'trainable-1'
    },
    {
      name: 'Talk Shit',
      description:
        'When in Hybrid form, if Sonar is sent to a call that fails, he will talk his way out and reattempt the call.',
      slot: 'trainable-2'
    }
  ],
  waterboy: [
    {
      name: 'Eager Sponge',
      description:
        'Waterboy assigns himself when not sent often. He gains +1 to the highest stat for the call. He can only be removed once.',
      slot: 'starting'
    },
    {
      name: 'Eager Super Sponge',
      description:
        'Upgrades Eager Sponge. Waterboy now gains +3 to the highest stat for that call.',
      slot: 'trainable-1',
      overridesStarting: true
    },
    {
      name: 'Holy Water Spit',
      description:
        'Waterboy no longer assigns himself. Waterboy will heal up to two heroes when sent on a call together.',
      slot: 'trainable-2'
    }
  ],
  'blonde-blazer': [
    {
      name: 'Radiant Light',
      description:
        "All heroes that pass through Blazer's radiant light gain a protective shield that defends them against one injury.",
      slot: 'starting'
    }
  ]
} as const satisfies Partial<Record<HeroId, HeroPowerSet>>;

// * The single source for feature 012: the game-data export derives the API validator's `special_powers` block from it, so a value here is never restated there. Each toggle cycles `0..max`.
export const SPECIAL_POWER_MECHANICS = {
  flambae: {
    type: 'supernova',
    max: 1,
    requiredPower: 'trainable-2',
    affectedStats: ['combat', 'mobility']
  },
  coupe: {
    type: 'en-pointe',
    max: 2,
    basePower: 'starting',
    upgradePower: 'trainable-2',
    baseBonus: 1,
    upgradeBonus: 3
  },
  golem: {
    type: 'spread-thin',
    // * One state per empty slot he can expand into: calls hold four slots and Golem occupies one.
    max: 3,
    requiredPower: 'trainable-1',
    percentPerSlot: 0.25
  }
} as const satisfies Partial<Record<HeroId, unknown>>;

export type FlightInfo = {
  // * Null where the game never names the flight (Blonde Blazer): the UI supplies a generic word rather than the data inventing a proper noun.
  name: string | null;
  description: string;
};

export const HERO_FLIGHT = {
  coupe: {
    name: "En L'air",
    description: 'Coupé flies to call locations, greatly reducing travel time.'
  },
  flambae: {
    name: 'Flybae',
    description:
      'Flambae flies to call locations, greatly reducing travel time.'
  },
  sonar: {
    name: 'Strong Back',
    description:
      'If transformed, Sonar flies to call locations, greatly reducing travel time. He also carries non-flying heroes.'
  },
  phenomaman: {
    name: 'Fly-Nomenal',
    description:
      'Phenomaman flies to call locations, greatly reducing travel time. Disabled by Heavily Medicated.'
  },
  'blonde-blazer': {
    name: null,
    description:
      'Blonde Blazer flies to call locations, greatly reducing travel time.'
  }
} as const satisfies Partial<Record<HeroId, FlightInfo>>;

export const HERO_FLIGHT_CAPABILITY = {
  'blonde-blazer': { type: 'innate' },
  phenomaman: {
    type: 'conditional-power',
    requiresPowerSlot: 'trainable-1',
    inverted: true
  }, // * Loses flight if Heavily Medicated selected
  sonar: { type: 'trainable' }, // * Only visually active when transformed
  coupe: { type: 'trainable' },
  flambae: { type: 'trainable' }
} as const satisfies Partial<Record<HeroId, FlightCapability>>;

export type SynergyPair = {
  hero1: HeroId;
  hero2: HeroId;
};

// * +5% success per level.
export type SynergyLevel = 0 | 1 | 2 | 3;

export const BASE_SYNERGY_PAIRS: readonly SynergyPair[] = [
  { hero1: 'golem', hero2: 'invisigal' },
  { hero1: 'prism', hero2: 'flambae' },
  { hero1: 'malevola', hero2: 'sonar' },
  { hero1: 'punch-up', hero2: 'coupe' }
];

// * The cut hero's base partner (Punch Up for Coupé, Malevola for Sonar) pairs with the episode 4 hire instead.
export const CONDITIONAL_SYNERGY_PAIRS = {
  'coupe-cut-phenomaman-hired': { hero1: 'punch-up', hero2: 'phenomaman' },
  'coupe-cut-waterboy-hired': { hero1: 'punch-up', hero2: 'waterboy' },
  'sonar-cut-phenomaman-hired': { hero1: 'malevola', hero2: 'phenomaman' },
  'sonar-cut-waterboy-hired': { hero1: 'malevola', hero2: 'waterboy' }
} as const satisfies Record<string, SynergyPair>;

export type Hero = {
  id: HeroId;
  name: string;
  startingStats: HeroStats;
};

// * The single source of the game data (feature 002), transcribed from `catalyst/context/game-mechanics.md`. A constant rather than an endpoint because it feeds the compile-time type system; the API validates saved builds against a fixture generated from it (decision 004).
export const HEROES: Hero[] = [
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

// * The cast is safe: `Object.fromEntries` widens the key to string, and `HEROES` covers every `HeroId` by construction.
export const HERO_STARTING_STATS = Object.fromEntries(
  HEROES.map((hero) => [hero.id, hero.startingStats])
) as Record<HeroId, HeroStats>;
