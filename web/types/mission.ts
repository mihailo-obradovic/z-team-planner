import type { HeroId, HeroStats } from '@/types/hero';

export const MISSION_SLOT_COUNT = 4;
export const MISSION_TEMPLATE_COUNT = 3;

// * Prism's stat-only occupant, as it appears in a team slot and in the serialized `mh` key.
export const ILLUSION_SLOT = 'illusion';

export type MissionSlot = HeroId | typeof ILLUSION_SLOT | null;

// * Threshold columns are per-stat and optional; which template may carry which is fixed:
// * only template #2 (index 1) carries `xp`, only template #3 (index 2) carries `fail`.
export interface MissionTemplate {
  req: HeroStats;
  xp: Partial<HeroStats>;
  fail: Partial<HeroStats>;
}

// ! `null` until the client-side roll: `/` is prerendered, so a random default in `useState`
// ! would bake one roll into the payload and every visitor would share it.
export type MissionTemplates = MissionTemplate[] | null;
