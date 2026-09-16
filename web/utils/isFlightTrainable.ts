import { FLIGHT_SCHOOL_HEROES } from '@/types/hero';

import type { HeroId } from '@/types/hero';

// * Every other hero's flight is settled by their own data — innate, power-driven, or absent — so no control on a card can toggle it.
export function isFlightTrainable(id: HeroId): boolean {
  return (FLIGHT_SCHOOL_HEROES as readonly HeroId[]).includes(id);
}
