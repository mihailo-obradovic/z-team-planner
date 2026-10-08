import { PORTRAIT_WIDTHS } from '@/config/portraits';

import type { PortraitUsage } from '@/config/portraits';
import type { HeroId } from '@/types/hero';

// * Breakpoints the dialog's portraits show at: the panel from `md`, the rail from `lg` and the ribbon below it (HeroDetailDialog, HeroRosterStrip).
const PANEL_QUERY = '(min-width: 48rem)';
const RAIL_QUERY = '(min-width: 64rem)';

const IDLE_FALLBACK_MS = 200;

// * Once per page load, not per mount: coming back to `/` from `/privacy` finds the portraits already held.
let started = false;

// * Feature 028: after `/` has loaded and the browser is idle, one low-priority batch fetches the synergy tab's portraits, then the dialog's, as the exact variants their sites will request, so the later render is a cache hit.
export function usePortraitPrefetch() {
  const $img = useImage();

  const { synergyPairColumns, ep8Recruits, showEp8Recruits, monsterForm } =
    useHeroPlanner();

  const synergyUsage = useSynergyPortraitUsage();

  // * The modifiers NuxtImg builds from HeroPortrait's props; `quality` is filled in by the component, not by `getSizes`, so it is restated here.
  function portraitSrcset(heroId: HeroId, usage: PortraitUsage) {
    return $img.getSizes(
      heroPortraitSrc(heroId, monsterForm.value ? 'monster' : 'hybrid'),
      {
        densities: 'x1 x2',
        modifiers: {
          width: PORTRAIT_WIDTHS[usage],
          format: 'avif',
          quality: $img.options.quality
        }
      }
    );
  }

  function fetchPortrait(heroId: HeroId, usage: PortraitUsage) {
    const { src, srcset } = portraitSrcset(heroId, usage);
    const image = new Image();

    image.fetchPriority = 'low';
    image.decoding = 'async';

    return new Promise<void>((resolve) => {
      image.onload = () => resolve();
      image.onerror = () => resolve();
      image.srcset = srcset;
      image.src = src ?? '';
    });
  }

  function dialogUsages(): PortraitUsage[] {
    const usages: PortraitUsage[] = ['header'];

    if (matchMedia(PANEL_QUERY).matches) {
      usages.push('panel');
    }

    usages.push(matchMedia(RAIL_QUERY).matches ? 'rail' : 'ribbon');

    return usages;
  }

  async function prefetch() {
    const paired = synergyPairColumns.value.flatMap((column) => [
      column.top.id,
      column.bottom.id
    ]);

    await Promise.all(
      paired.map((heroId) => fetchPortrait(heroId, synergyUsage.value))
    );

    // * The dialog's roster, in the order HeroDetailDialog builds it.
    const roster = showEp8Recruits.value
      ? [...paired, ...ep8Recruits.value.map((hero) => hero.id)]
      : paired;
    const usages = dialogUsages();

    await Promise.all(
      roster.flatMap((heroId) =>
        usages.map((usage) => fetchPortrait(heroId, usage))
      )
    );
  }

  function scheduleWhenIdle() {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(prefetch);
      return;
    }

    setTimeout(prefetch, IDLE_FALLBACK_MS);
  }

  function start() {
    if (started) {
      return;
    }

    started = true;

    if (document.readyState === 'complete') {
      scheduleWhenIdle();
      return;
    }

    window.addEventListener('load', scheduleWhenIdle, { once: true });
  }

  return { start };
}
