import type { HeroId } from '@/types/hero';

// * Sonar's portrait follows the shared monster form (feature 012); every other hero has one image.
export function heroPortraitSrc(heroId: HeroId, monsterForm: boolean): string {
  if (heroId === 'sonar') {
    return monsterForm
      ? '/images/portraits/sonar-monster.webp'
      : '/images/portraits/sonar-hybrid.webp';
  }
  return `/images/portraits/${heroId}.webp`;
}
