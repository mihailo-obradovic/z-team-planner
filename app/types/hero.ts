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

export interface HeroPowerInfo {
  name: string;
  description: string;
}

export type HeroPowerSet = HeroPowerInfo[];

export type HeroPowerState = [boolean, boolean, boolean];

export const MAX_POWER_TRAININGS = 7;
export const MAX_FLIGHT_TRAININGS = 2;

export const FLIGHT_SCHOOL_HEROES = ['coupe', 'flambae', 'sonar'] as const satisfies readonly HeroId[];

export const HERO_POWERS: Partial<Record<HeroId, HeroPowerSet>> = {
  coupe: [
    { name: 'En Pointe', description: 'In 2+ slots calls, if placed in the first slot, Coupé gains +1 Combat. If placed in the second slot, she gains +1 Mobility.' },
    { name: 'Pirouette', description: 'If Coupé is sent on a call that fails, she will reattempt it.' },
    { name: 'À la Seconde', description: 'Upgrades En Pointe. If placed in the first slot, Coupé now gains +3 Combat. If placed in the second slot, she now gains +3 Mobility.' },
  ],
  flambae: [
    { name: 'On Fire', description: 'After success, Flambae gains +1 Combat and +1 Mobility. This effect stacks. All boosts reset after a failure.' },
    { name: 'Comet', description: 'After a success, Flambae also reduces call completion and travel time. If after two successes Flambae fails a third, he is downed.' },
    { name: 'Supernova', description: 'Upgrades On Fire. Succeeding twice will set Flambae\'s Combat and Mobility to max and removes rest time. After a fail, stats drop to 1.' },
  ],
  golem: [
    { name: 'Diamond in the Rough', description: 'When Golem is in a call with 2+ slots, certain ones may grant +2 to a stat and -1 to others when he\'s assigned.' },
    { name: 'Spread Thin', description: 'Golem expands to fill each empty slot, increasing his stats by 25% per slot up to 200% when beneficial.' },
    { name: 'Found Himself', description: 'Once per shift, all of Golem\'s stats can be reset within the hero Database, allowing for redistribution of points.' },
  ],
  invisigal: [
    { name: 'Lone Wolf', description: 'When sent alone, Invisigal reduces travel time and call completion time.' },
    { name: 'Ear to the Ground', description: 'With her connections, Invisigal can reveal the number of slots and crime type on hover for certain calls before they happen.' },
    { name: 'Wolf Pack', description: 'If Invisigal is on the team, XP rewards are doubled.' },
  ],
  malevola: [
    { name: 'Life Trade', description: 'Malevola heals one hero when sent on a call together. She then receives +1 Charisma or Vigor. This effect stacks.' },
    { name: 'Life Trade Visions', description: 'After healing a hero, Malevola also reveals the stats of the next call she\'s assigned to.' },
    { name: 'Portal Ritual', description: 'After healing a hero, Malevola also creates a portal near the call once per shift. The portal lasts 45 seconds after call completion.' },
  ],
  phenomaman: [
    { name: 'Easily Depressed', description: 'Phenomaman needs only 2 seconds rest, however if any call fails or misses, he will be depressed and need 45 seconds of rest.' },
    { name: 'Heavily Medicated', description: 'Upgrades Easily Depressed. Phenomaman loses his ability to fly and rests for 8 more seconds than usual, but no longer can become depressed.' },
    { name: 'Phenomenal Motivation', description: 'Heroes sent with Phenomaman have their rest time reduced by half if he completes the call with them.' },
  ],
  prism: [
    { name: 'Doppelganger Illusion', description: 'When assigned to a call, Prism duplicates the hero to her left, placing their illusion in an empty slot with half their stats.' },
    { name: 'Perfect Copy', description: 'Upgrades Doppelganger Illusion. Prism\'s duplicated illusions now have the full stats of the copied hero.' },
    { name: 'Long Range Illusion', description: 'When a call is about to expire, Prism creates an illusion that keeps the call up for a few more seconds. This happens once per shift.' },
  ],
  'punch-up': [
    { name: 'Hard Head', description: 'Punch Up doesn\'t receive any debuffs from injuries. He cannot be downed.' },
    { name: 'Squeeze In', description: 'On a call with <4 slots, Punch Up creates a slot exclusively for him to join.' },
    { name: 'Harder Head', description: 'While Punch Up is injured, he receives +2 Combat, +2 Vigor, and reduces rest time.' },
  ],
  sonar: [
    { name: 'Instincts', description: 'Sonar transforms after returning from a call. His Intellect swaps with Combat and his Charisma swaps with Vigor until the next call.' },
    { name: 'Bat Shit', description: 'In Mega Bat form, Sonar is immune to injuries and his resting time is reduced by half.' },
    { name: 'Talk Shit', description: 'When in Hybrid form, if Sonar is sent to a call that fails, he will talk his way out and reattempt the call.' },
  ],
  waterboy: [
    { name: 'Eager Sponge', description: 'Waterboy assigns himself when not sent often. He gains +1 to the highest stat for the call. He can only be removed once.' },
    { name: 'Eager Super Sponge', description: 'Upgrades Eager Sponge. Waterboy now gains +3 to the highest stat for that call.' },
    { name: 'Holy Water Spit', description: 'Waterboy no longer assigns himself. Waterboy will heal up to two heroes when sent on a call together.' },
  ],
  'blonde-blazer': [
    { name: 'Radiant Light', description: 'All heroes that pass through Blazer\'s radiant light gain a protective shield that defends them against one injury.' },
  ],
};

export const HERO_FLIGHT: Partial<Record<HeroId, HeroPowerInfo>> = {
  coupe: { name: 'En L\'air', description: 'Coupé flies to call locations, greatly reducing travel time.' },
  flambae: { name: 'Flybae', description: 'Flambae flies to call locations, greatly reducing travel time.' },
  sonar: { name: 'Strong Back', description: 'If transformed, Sonar flies to call locations, greatly reducing travel time. He also carries non-flying heroes.' },
  phenomaman: { name: 'Fly-Nomenal', description: 'Phenomaman flies to call locations, greatly reducing travel time. Disabled by Heavily Medicated.' },
  'blonde-blazer': { name: 'Flight', description: 'Blonde Blazer flies to call locations, greatly reducing travel time.' },
};

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
