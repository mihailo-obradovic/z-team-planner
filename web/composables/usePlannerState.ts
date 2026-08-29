import { DEFAULT_EP3_CUT, DEFAULT_EP4_HIRE } from '@/types/hero';

import type { HeroId, HeroPowerSelection, HeroStats } from '@/types/hero';

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
