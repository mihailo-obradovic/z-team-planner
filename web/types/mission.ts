import type { HeroId, HeroStats } from '@/types/hero';

export const MISSION_SLOT_COUNT = 4;
export const MISSION_TEMPLATE_COUNT = 3;

// * Prism's stat-only occupant, as it appears in a team slot and in the serialized `mh` key.
export const ILLUSION_SLOT = 'illusion';

// * Golem's expansion (feature 015): each copy occupies a slot to his right and pays him +25%, contributing no stats itself.
export const GOLEM_COPY_SLOT = 'copy';

export type MissionSlot =
  | HeroId
  | typeof ILLUSION_SLOT
  | typeof GOLEM_COPY_SLOT
  | null;

// * Whether the power a slot rule reads is trained; each rule names the trainable it means.
export type SlotPowerTraining = 'trained' | 'untrained';

export type IllusionRatio = 0.5 | 1;

// * A template holds at most one 2×XP threshold and at most one fail threshold, each on one stat.
export type MissionTemplate = {
  req: HeroStats;
  xp: Partial<HeroStats>;
  fail: Partial<HeroStats>;
};

// * Worked examples: a plain call, a 2×XP stretch and the common end-game fail check. Each threshold sits above its own REQ (feature 015).
export const DEFAULT_MISSION_TEMPLATES: MissionTemplate[] = [
  {
    req: { combat: 6, intellect: 3, vigor: 5, charisma: 3, mobility: 4 },
    xp: {},
    fail: {}
  },
  {
    req: { combat: 2, intellect: 6, vigor: 3, charisma: 6, mobility: 3 },
    xp: { intellect: 8 },
    fail: {}
  },
  {
    req: { combat: 5, intellect: 3, vigor: 6, charisma: 2, mobility: 5 },
    xp: {},
    fail: { combat: 8 }
  }
];
