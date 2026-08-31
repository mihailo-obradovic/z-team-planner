import type { HeroId } from '@/types/hero';

// * Compact serialized format for URL sharing and localStorage. Only non-default values are included to keep URLs short.
// * Field naming uses short keys to minimize URL length:
// * - ec = episode 3 cut
// * - eh = episode 4 hire
// * - e8 = show episode 8 recruits
// * - lu = level-ups (stat allocations per hero)
// * - bl = bonus levels per hero
// * - pw = power selections per hero [startingRevealed, trainableSelected]
// * - sp = special power states per hero
// * - fl = flight-trained hero IDs
// * - mt = mission templates, always all 3 once rolled: r = REQs in STAT_NAMES order;
// *        x (template #2 only) / f (template #3 only) = per-stat thresholds, 0 = unset
// * - mh = mission team slots, all 4 in order: hero id, "illusion", or null
// * - ml = mission synergy level (1–3)
// * - ma = active mission template index (1–2)
export interface SerializedMissionTemplate {
  r: number[];
  x?: number[];
  f?: number[];
}

export interface SerializedBuild {
  v: 1;
  ec?: HeroId;
  eh?: HeroId;
  e8?: 1;
  lu?: Record<string, number[]>;
  bl?: Record<string, number>;
  pw?: Record<string, [number, number]>;
  sp?: Record<string, number>;
  fl?: string[];
  mt?: SerializedMissionTemplate[];
  mh?: (string | null)[];
  ml?: number;
  ma?: number;
}

export interface LocalBuild {
  id: string;
  name: string;
  data: SerializedBuild;
}
