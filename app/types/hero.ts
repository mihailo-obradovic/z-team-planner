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

export const STAT_NAMES = ['combat', 'intellect', 'vigor', 'charisma', 'mobility'] as const;

export const EP3_CUT_OPTIONS = ['coupe', 'sonar'] as const satisfies readonly HeroId[];
export const EP4_HIRE_OPTIONS = ['phenomaman', 'waterboy'] as const satisfies readonly HeroId[];

export const FIXED_LEVEL_HEROES: Partial<Record<HeroId, number>> = {
  phenomaman: 12,
  'blonde-blazer': 20,
};

export const MAX_LEVEL_UPS = 9;
export const MAX_STAT_VALUE = 10;

export type StatName = typeof STAT_NAMES[number];

export type HeroStats = Record<StatName, number>;

export type ZeroStats = Record<StatName, 0>;

export type PowerType = 'starting' | 'unlockable';

export interface HeroPower {
  name: string;
  description: string;
  type: PowerType;
  overrides?: string;
}

interface HeroBase {
  id: HeroId;
  name: string;
  startingStats: HeroStats;
  level: number;
  canFly: boolean;
  powers: HeroPower[];
  injured: boolean;
  synergyPartner: HeroId;
}

interface LevelableHero extends HeroBase {
  canLevelUp: true;
  levelUpStats: HeroStats;
  bonusStats: HeroStats;
}

interface FixedLevelHero extends HeroBase {
  canLevelUp: false;
  levelUpStats: ZeroStats;
  bonusStats: ZeroStats;
}

export type Hero = LevelableHero | FixedLevelHero;
