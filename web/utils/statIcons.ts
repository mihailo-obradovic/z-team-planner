import type { StatName } from '@/types/hero';

export const STAT_ICONS: Record<StatName, string> = {
  combat: 'i-lucide-swords',
  intellect: 'i-lucide-graduation-cap',
  vigor: 'i-lucide-heart',
  charisma: 'i-lucide-message-circle',
  mobility: 'i-lucide-chevrons-right'
};

// * The radar's axis order, deliberately not STAT_NAMES: it decides which stat takes the apex and how the shape reads, and every radar must agree on it.
export const RADAR_STAT_ORDER: StatName[] = [
  'combat',
  'vigor',
  'mobility',
  'charisma',
  'intellect'
];
