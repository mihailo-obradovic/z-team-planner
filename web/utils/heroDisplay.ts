import type { HeroId, StatName } from '@/types/hero';

export type SonarForm = 'hybrid' | 'monster';

// * Sonar's portrait follows the shared monster form (feature 012); every other hero has one image.
export function heroPortraitSrc(heroId: HeroId, form: SonarForm): string {
  if (heroId === 'sonar') {
    return form === 'monster'
      ? '/images/portraits/sonar-monster.webp'
      : '/images/portraits/sonar-hybrid.webp';
  }

  return `/images/portraits/${heroId}.webp`;
}

export const STAT_ICONS: Record<StatName, string> = {
  combat: 'i-lucide-swords',
  intellect: 'i-lucide-graduation-cap',
  vigor: 'i-lucide-heart',
  charisma: 'i-lucide-message-circle',
  mobility: 'i-lucide-chevrons-right'
};

// * By power slot: the starting power, then the two trainable ones.
export const POWER_ICONS = [
  'i-lucide-zap',
  'i-lucide-shield',
  'i-lucide-swords'
] as const;

// * The radar's axis order, deliberately not STAT_NAMES: it decides which stat takes the apex and how the shape reads, and every radar must agree on it.
export const RADAR_STAT_ORDER: StatName[] = [
  'combat',
  'vigor',
  'mobility',
  'charisma',
  'intellect'
];
