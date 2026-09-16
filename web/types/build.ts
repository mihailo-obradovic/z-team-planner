import type { HeroId } from '@/types/hero';

// * Every array follows `STAT_NAMES` order.
export type SerializedMissionTemplate = {
  // * REQ values
  r: number[];
  // * 2×XP thresholds, 0 where unset
  x?: number[];
  // * Fail thresholds, 0 where unset
  f?: number[];
};

// * Keys are short and non-default values are omitted, because the whole document travels in a share URL.
export type SerializedBuild = {
  v: 1;
  // * Episode 3 cut
  ec?: HeroId;
  // * Episode 4 hire
  eh?: HeroId;
  // * Episode 8 recruits shown
  e8?: 1;
  // * Level-ups per hero, in `STAT_NAMES` order
  lu?: Record<string, number[]>;
  // * Bonus levels per hero
  bl?: Record<string, number>;
  // * Power selections per hero: [startingRevealed, trainableSelected]
  pw?: Record<string, [number, number]>;
  // * Special power states per hero
  sp?: Record<string, number>;
  // * Flight-trained hero ids
  fl?: string[];
  // * All three mission templates, omitted while they equal the defaults
  mt?: SerializedMissionTemplate[];
  // * All four mission team slots in order: a hero id, `illusion`, `copy`, or null
  mh?: (string | null)[];
  // * Mission synergy level, 1–3
  ml?: number;
  // * Active mission template index, 1–2
  ma?: number;
};

export type LocalBuild = {
  id: string;
  name: string;
  data: SerializedBuild;
};
