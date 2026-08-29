import type { HeroId, HeroPowerSelection, HeroStats } from '@/types/hero';

// * The planner state as one object, so the serialiser takes a parameter instead of eight.
// * These are the same `useState` refs the sub-composables create — `useState` is keyed globally, so this reads and writes the live planner without importing any of them. Handing them around as one value is what keeps `serializeBuild(state)` from being `serializeBuild(a, b, c, d, e, f, g, h)`, where two same-typed refs in the wrong order type-check.
export type PlannerState = ReturnType<typeof usePlannerState>;

export function usePlannerState() {
  return {
    ep3Cut: useState<HeroId>('ep3Cut'),
    ep4Hire: useState<HeroId>('ep4Hire'),
    showEp8Recruits: useState<boolean>('showEp8Recruits'),
    heroLevelUps: useState<Partial<Record<HeroId, HeroStats>>>('heroLevelUps'),
    heroBonusLevels:
      useState<Partial<Record<HeroId, number>>>('heroBonusLevels'),
    heroPowers:
      useState<Partial<Record<HeroId, HeroPowerSelection>>>('heroPowers'),
    heroSpecialPowers:
      useState<Partial<Record<HeroId, number>>>('heroSpecialPowers'),
    heroFlights: useState<Partial<Record<HeroId, boolean>>>('heroFlights')
  };
}
