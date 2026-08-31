import type { HeroId, HeroStats } from '@/types/hero';

export const MISSION_SLOT_COUNT = 4;
export const MISSION_TEMPLATE_COUNT = 3;

// * Prism's stat-only occupant, as it appears in a team slot and in the serialized `mh` key.
export const ILLUSION_SLOT = 'illusion';

// * Golem's expansion (feature 015): each copy occupies a slot to his right and pays him
// * +25%; the copy itself contributes no stats.
export const GOLEM_COPY_SLOT = 'copy';

export type MissionSlot =
  | HeroId
  | typeof ILLUSION_SLOT
  | typeof GOLEM_COPY_SLOT
  | null;

// * Condition columns are optional and single-valued: a template holds at most one 2×XP
// * threshold and at most one fail threshold, each on one stat.
export interface MissionTemplate {
  req: HeroStats;
  xp: Partial<HeroStats>;
  fail: Partial<HeroStats>;
}

// ! `null` until the client-side roll: `/` is prerendered, so a random default in `useState`
// ! would bake one roll into the payload and every visitor would share it.
export type MissionTemplates = MissionTemplate[] | null;
