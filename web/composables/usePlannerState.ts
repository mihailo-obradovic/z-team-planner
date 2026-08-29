import { DEFAULT_EP3_CUT, DEFAULT_EP4_HIRE } from '@/types/hero';

import type { HeroId, HeroPowerSelection, HeroStats } from '@/types/hero';

// * The planner state as one object, so the serialiser takes a parameter instead of eight.
// * These are the same `useState` refs the hero sub-composables create — `useState` is keyed globally, so this reads and writes the live planner without importing any of them. Handing them around as one value is what keeps `serializeBuild(state)` from being `serializeBuild(a, b, c, d, e, f, g, h)`, where two same-typed refs in the wrong order type-check.
// ! Every key carries its initial value. `useState`'s initialiser only fires for a key that is not set yet, so this agrees with the sub-composables wherever both run — and a caller that reaches the planner state without them (a component under test with `useHeroPlanner` mocked) still gets refs holding a value rather than `undefined`.
export type PlannerState = ReturnType<typeof usePlannerState>;

export function usePlannerState() {
  return {
    ep3Cut: useState<HeroId>('ep3Cut', () => DEFAULT_EP3_CUT),
    ep4Hire: useState<HeroId>('ep4Hire', () => DEFAULT_EP4_HIRE),
    showEp8Recruits: useState<boolean>('showEp8Recruits', () => false),
    heroLevelUps: useState<Partial<Record<HeroId, HeroStats>>>(
      'heroLevelUps',
      () => ({})
    ),
    heroBonusLevels: useState<Partial<Record<HeroId, number>>>(
      'heroBonusLevels',
      () => ({})
    ),
    heroPowers: useState<Partial<Record<HeroId, HeroPowerSelection>>>(
      'heroPowers',
      () => ({})
    ),
    heroSpecialPowers: useState<Partial<Record<HeroId, number>>>(
      'heroSpecialPowers',
      () => ({})
    ),
    heroFlights: useState<Partial<Record<HeroId, boolean>>>(
      'heroFlights',
      () => ({})
    )
  };
}
