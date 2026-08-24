import type { StatName } from '@/types/hero';

/**
 * Lucide glyph per stat, shared by every surface that renders one so the
 * roster and the detail dialog cannot drift apart.
 *
 * Icons rather than the raster stat-icons this replaced: a glyph has to
 * inherit its text colour, which a webp cannot (design-system annex §9).
 */
export const STAT_ICONS: Record<StatName, string> = {
  combat: 'i-lucide-swords',
  intellect: 'i-lucide-graduation-cap',
  vigor: 'i-lucide-heart',
  charisma: 'i-lucide-message-circle',
  mobility: 'i-lucide-chevrons-right'
};
