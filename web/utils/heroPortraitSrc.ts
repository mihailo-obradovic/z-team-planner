import type { HeroId } from '@/types/hero';

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
