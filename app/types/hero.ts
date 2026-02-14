/**
 * Hero Type System for Z-Team Planner
 *
 * This file defines all types related to heroes in the Dispatch game.
 * It follows the game mechanics documented in .claude/rules/dispatch.md
 *
 * ## Design Principles
 *
 * 1. **Separation of Data and State**: The `Hero` type contains only static data
 *    (id, name, starting stats). All dynamic state (level-ups, power selections,
 *    flight training) is managed separately in the useHeroPlanner composable.
 *
 * 2. **Type Safety**: Power and flight capabilities are strongly typed to prevent
 *    invalid configurations at compile time.
 *
 * 3. **Game Rule Encoding**: Types reflect game rules like:
 *    - Each hero has exactly 3 powers (1 starting + 2 trainable options)
 *    - Only 1 of the 2 trainable powers can be selected
 *    - Some powers override the starting power
 *    - Flight capability varies by hero type
 *    - Synergy pairs are specific combinations of heroes
 *
 * ## Type Organization
 *
 * - Hero Identifiers: HeroId union type
 * - Stats System: StatName, HeroStats, stat limits
 * - Episode Choices: Heroes that can be cut/hired
 * - Level System: Fixed vs levelable heroes, level caps
 * - Power System: Power definitions, selections, training limits
 * - Flight System: Flight capabilities and training
 * - Synergy System: Hero pair relationships and bonuses
 * - Hero Data: The main Hero interface
 */

// ============================================================================
// HERO IDENTIFIERS
// ============================================================================

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

// ============================================================================
// STATS SYSTEM
// ============================================================================

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

// ============================================================================
// EPISODE CHOICES
// ============================================================================

export const EP3_CUT_OPTIONS = [
  'coupe',
  'sonar'
] as const satisfies readonly HeroId[];

export const EP4_HIRE_OPTIONS = [
  'phenomaman',
  'waterboy'
] as const satisfies readonly HeroId[];

// ============================================================================
// LEVEL SYSTEM
// ============================================================================

export const FIXED_LEVEL_HEROES = {
  phenomaman: 12,
  'blonde-blazer': 20
} as const satisfies Partial<Record<HeroId, number>>;

export const MAX_LEVEL_UPS = 9;
export const MAX_BONUS_POINTS = 4;

// ============================================================================
// POWER SYSTEM
// ============================================================================

/**
 * Definition of a single hero power.
 * Each hero has exactly 3 powers: 1 starting + 2 trainable options.
 * Only one of the two trainable powers can be selected.
 */
export interface HeroPowerDefinition {
  name: string;
  description: string;
  /** Which slot this power occupies in the hero's power set */
  slot: 'starting' | 'trainable-1' | 'trainable-2';
  /** If true, selecting this power replaces/upgrades the starting power */
  overridesStarting?: boolean;
}

/**
 * A complete set of powers for a hero (always 3).
 * Index 0: Starting power (always present, may be overridden)
 * Index 1: First trainable option (mutually exclusive with index 2)
 * Index 2: Second trainable option (mutually exclusive with index 1)
 */
export type HeroPowerSet = [
  HeroPowerDefinition,
  HeroPowerDefinition,
  HeroPowerDefinition
];

/**
 * User's power selection state for a hero.
 * - startingRevealed: Whether the starting power has been revealed/used
 * - trainableSelected: Which trainable power is selected (0 = none, 1 = first, 2 = second)
 */
export interface HeroPowerSelection {
  startingRevealed: boolean;
  trainableSelected: 0 | 1 | 2;
}

export const MAX_POWER_TRAININGS = 7;

// ============================================================================
// FLIGHT SYSTEM
// ============================================================================

/**
 * Flight capability varies by hero:
 * - 'innate': Always can fly (Blonde Blazer)
 * - 'conditional-power': Can fly if specific power is/isn't selected (Phenomaman loses flight with Heavily Medicated)
 * - 'trainable': Can learn to fly through Flight School (Coupe, Flambae, Sonar)
 * - 'none': Cannot fly
 *
 * Note: Sonar's flight is 'trainable' but only visually shown when transformed - the transform
 * state is a UI concern handled in HeroCard, not a capability restriction.
 */
export type FlightCapability =
  | { type: 'innate' }
  | { type: 'conditional-power'; requiresPowerSlot: 'starting' | 'trainable-1' | 'trainable-2'; inverted?: boolean }
  | { type: 'trainable' }
  | { type: 'none' };

export const FLIGHT_SCHOOL_HEROES = [
  'coupe',
  'flambae',
  'sonar'
] as const satisfies readonly HeroId[];

export const MAX_FLIGHT_TRAININGS = 2;

export const HERO_POWERS = {
  coupe: [
    {
      name: 'En Pointe',
      description:
        'In 2+ slots calls, if placed in the first slot, Coupé gains +1 Combat. If placed in the second slot, she gains +1 Mobility.',
      slot: 'starting' as const
    },
    {
      name: 'Pirouette',
      description:
        'If Coupé is sent on a call that fails, she will reattempt it.',
      slot: 'trainable-1' as const
    },
    {
      name: 'À la Seconde',
      description:
        'Upgrades En Pointe. If placed in the first slot, Coupé now gains +3 Combat. If placed in the second slot, she now gains +3 Mobility.',
      slot: 'trainable-2' as const,
      overridesStarting: true
    }
  ],
  flambae: [
    {
      name: 'On Fire',
      description:
        'After success, Flambae gains +1 Combat and +1 Mobility. This effect stacks. All boosts reset after a failure.',
      slot: 'starting' as const
    },
    {
      name: 'Comet',
      description:
        'After a success, Flambae also reduces call completion and travel time. If after two successes Flambae fails a third, he is downed.',
      slot: 'trainable-1' as const
    },
    {
      name: 'Supernova',
      description:
        "Upgrades On Fire. Succeeding twice will set Flambae's Combat and Mobility to max and removes rest time. After a fail, stats drop to 1.",
      slot: 'trainable-2' as const,
      overridesStarting: true
    }
  ],
  golem: [
    {
      name: 'Diamond in the Rough',
      description:
        "When Golem is in a call with 2+ slots, certain ones may grant +2 to a stat and -1 to others when he's assigned.",
      slot: 'starting' as const
    },
    {
      name: 'Spread Thin',
      description:
        'Golem expands to fill each empty slot, increasing his stats by 25% per slot up to 200% when beneficial.',
      slot: 'trainable-1' as const
    },
    {
      name: 'Found Himself',
      description:
        "Once per shift, all of Golem's stats can be reset within the hero Database, allowing for redistribution of points.",
      slot: 'trainable-2' as const
    }
  ],
  invisigal: [
    {
      name: 'Lone Wolf',
      description:
        'When sent alone, Invisigal reduces travel time and call completion time.',
      slot: 'starting' as const
    },
    {
      name: 'Ear to the Ground',
      description:
        'With her connections, Invisigal can reveal the number of slots and crime type on hover for certain calls before they happen.',
      slot: 'trainable-1' as const
    },
    {
      name: 'Wolf Pack',
      description: 'If Invisigal is on the team, XP rewards are doubled.',
      slot: 'trainable-2' as const
    }
  ],
  malevola: [
    {
      name: 'Life Trade',
      description:
        'Malevola heals one hero when sent on a call together. She then receives +1 Charisma or Vigor. This effect stacks.',
      slot: 'starting' as const
    },
    {
      name: 'Life Trade Visions',
      description:
        "After healing a hero, Malevola also reveals the stats of the next call she's assigned to.",
      slot: 'trainable-1' as const
    },
    {
      name: 'Portal Ritual',
      description:
        'After healing a hero, Malevola also creates a portal near the call once per shift. The portal lasts 45 seconds after call completion.',
      slot: 'trainable-2' as const
    }
  ],
  phenomaman: [
    {
      name: 'Easily Depressed',
      description:
        'Phenomaman needs only 2 seconds rest, however if any call fails or misses, he will be depressed and need 45 seconds of rest.',
      slot: 'starting' as const
    },
    {
      name: 'Heavily Medicated',
      description:
        'Upgrades Easily Depressed. Phenomaman loses his ability to fly and rests for 8 more seconds than usual, but no longer can become depressed.',
      slot: 'trainable-1' as const,
      overridesStarting: true
    },
    {
      name: 'Phenomenal Motivation',
      description:
        'Heroes sent with Phenomaman have their rest time reduced by half if he completes the call with them.',
      slot: 'trainable-2' as const
    }
  ],
  prism: [
    {
      name: 'Doppelganger Illusion',
      description:
        'When assigned to a call, Prism duplicates the hero to her left, placing their illusion in an empty slot with half their stats.',
      slot: 'starting' as const
    },
    {
      name: 'Perfect Copy',
      description:
        "Upgrades Doppelganger Illusion. Prism's duplicated illusions now have the full stats of the copied hero.",
      slot: 'trainable-1' as const,
      overridesStarting: true
    },
    {
      name: 'Long Range Illusion',
      description:
        'When a call is about to expire, Prism creates an illusion that keeps the call up for a few more seconds. This happens once per shift.',
      slot: 'trainable-2' as const
    }
  ],
  'punch-up': [
    {
      name: 'Hard Head',
      description:
        "Punch Up doesn't receive any debuffs from injuries. He cannot be downed.",
      slot: 'starting' as const
    },
    {
      name: 'Squeeze In',
      description:
        'On a call with <4 slots, Punch Up creates a slot exclusively for him to join.',
      slot: 'trainable-1' as const
    },
    {
      name: 'Harder Head',
      description:
        'While Punch Up is injured, he receives +2 Combat, +2 Vigor, and reduces rest time.',
      slot: 'trainable-2' as const
    }
  ],
  sonar: [
    {
      name: 'Instincts',
      description:
        'Sonar transforms after returning from a call. His Intellect swaps with Combat and his Charisma swaps with Vigor until the next call.',
      slot: 'starting' as const
    },
    {
      name: 'Bat Shit',
      description:
        'In Mega Bat form, Sonar is immune to injuries and his resting time is reduced by half.',
      slot: 'trainable-1' as const
    },
    {
      name: 'Talk Shit',
      description:
        'When in Hybrid form, if Sonar is sent to a call that fails, he will talk his way out and reattempt the call.',
      slot: 'trainable-2' as const
    }
  ],
  waterboy: [
    {
      name: 'Eager Sponge',
      description:
        'Waterboy assigns himself when not sent often. He gains +1 to the highest stat for the call. He can only be removed once.',
      slot: 'starting' as const
    },
    {
      name: 'Eager Super Sponge',
      description:
        'Upgrades Eager Sponge. Waterboy now gains +3 to the highest stat for that call.',
      slot: 'trainable-1' as const,
      overridesStarting: true
    },
    {
      name: 'Holy Water Spit',
      description:
        'Waterboy no longer assigns himself. Waterboy will heal up to two heroes when sent on a call together.',
      slot: 'trainable-2' as const
    }
  ],
  'blonde-blazer': [
    {
      name: 'Radiant Light',
      description:
        "All heroes that pass through Blazer's radiant light gain a protective shield that defends them against one injury.",
      slot: 'starting' as const
    },
    // Blonde Blazer only has starting power, add dummy trainable slots
    {
      name: '',
      description: '',
      slot: 'trainable-1' as const
    },
    {
      name: '',
      description: '',
      slot: 'trainable-2' as const
    }
  ]
} as const satisfies Partial<Record<HeroId, HeroPowerSet>>;

/**
 * Flight capability information for each hero.
 * Name and description of their flight ability.
 */
export interface FlightInfo {
  name: string;
  description: string;
}

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
    name: 'Flight',
    description:
      'Blonde Blazer flies to call locations, greatly reducing travel time.'
  }
} as const satisfies Partial<Record<HeroId, FlightInfo>>;

/**
 * Flight capability type for each hero.
 * Determines how/when a hero can fly.
 */
export const HERO_FLIGHT_CAPABILITY = {
  'blonde-blazer': { type: 'innate' },
  phenomaman: { type: 'conditional-power', requiresPowerSlot: 'trainable-1', inverted: true }, // Loses flight if Heavily Medicated selected
  sonar: { type: 'trainable' }, // Must train at Flight School; only visually active when transformed (UI concern)
  coupe: { type: 'trainable' },
  flambae: { type: 'trainable' }
} as const satisfies Partial<Record<HeroId, FlightCapability>>;

// ============================================================================
// SYNERGY SYSTEM
// ============================================================================

/**
 * Synergy pairs increase success chance by 5% per level (max 15% at level 3).
 * Only certain hero combinations have synergy.
 */
export interface SynergyPair {
  hero1: HeroId;
  hero2: HeroId;
}

export type SynergyLevel = 1 | 2 | 3;

/**
 * Base synergy pairs that are always available (from Episode 3 onwards).
 */
export const BASE_SYNERGY_PAIRS: readonly SynergyPair[] = [
  { hero1: 'golem', hero2: 'invisigal' },
  { hero1: 'prism', hero2: 'flambae' },
  { hero1: 'malevola', hero2: 'sonar' },
  { hero1: 'punch-up', hero2: 'coupe' }
] as const;

/**
 * Conditional synergy pairs that depend on Episode 3/4 choices.
 * When Coupé is cut, Punch Up loses their partner and gains a new one (Phenomaman or Waterboy).
 * When Sonar is cut, Malevola loses their partner and gains a new one (Phenomaman or Waterboy).
 */
export const CONDITIONAL_SYNERGY_PAIRS = {
  'coupe-cut-phenomaman-hired': { hero1: 'punch-up', hero2: 'phenomaman' },
  'coupe-cut-waterboy-hired': { hero1: 'punch-up', hero2: 'waterboy' },
  'sonar-cut-phenomaman-hired': { hero1: 'malevola', hero2: 'phenomaman' },
  'sonar-cut-waterboy-hired': { hero1: 'malevola', hero2: 'waterboy' }
} as const satisfies Record<string, SynergyPair>;

// ============================================================================
// HERO DATA
// ============================================================================

/**
 * Hero data as returned from the API.
 * This is the static, unchanging information about a hero.
 * All dynamic state (level-ups, power selections, flight training) is managed
 * separately in the useHeroPlanner composable.
 */
export interface Hero {
  id: HeroId;
  name: string;
  startingStats: HeroStats;
}
