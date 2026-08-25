import type { HeroId } from '@/types/hero';

// ============================================================================
// BUILD SERIALIZATION
// ============================================================================

/**
 * Compact serialized format for URL sharing and localStorage.
 * Only non-default values are included to keep URLs short.
 *
 * Field naming uses short keys to minimize URL length:
 * - ec = episode 3 cut
 * - eh = episode 4 hire
 * - e8 = show episode 8 recruits
 * - lu = level-ups (stat allocations per hero)
 * - bl = bonus levels per hero
 * - pw = power selections per hero [startingRevealed, trainableSelected]
 * - sp = special power states per hero
 * - fl = flight-trained hero IDs
 */
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
}

// ============================================================================
// BUILD STORAGE
// ============================================================================

/**
 * A named build saved in localStorage.
 */
export interface SavedBuild {
  id: string;
  name: string;
  data: SerializedBuild;
  savedAt: number;
}
