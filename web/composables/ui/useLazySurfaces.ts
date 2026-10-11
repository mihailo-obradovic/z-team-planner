import type { WatchSource } from 'vue';

const IDLE_FALLBACK_MS = 200;

// * Decision 017: every surface a visitor opens is its own chunk, so the entry bundle carries only what the reveal paints (feature 023). The loaders are listed once, here, so the components, the idle preload and the hover preload all name the same chunks.
export const surfaceLoaders = {
  heroDetailDialog: () => import('@/components/hero/HeroDetailDialog.vue'),
  synergyPairCard: () => import('@/components/synergy/SynergyPairCard.vue'),
  missionTemplatesPanel: () =>
    import('@/components/mission/MissionTemplatesPanel.vue'),
  missionRequirementsPanel: () =>
    import('@/components/mission/MissionRequirementsPanel.vue'),
  missionMathPanel: () => import('@/components/mission/MissionMathPanel.vue'),
  missionTeamPanel: () => import('@/components/mission/MissionTeamPanel.vue'),
  storySetupDrawer: () => import('@/components/shell/StorySetupDrawer.vue'),
  localBuildDialogs: () => import('@/components/build/LocalBuildDialogs.vue'),
  cloudBuildDialogs: () => import('@/components/build/CloudBuildDialogs.vue'),
  openBuildDialogs: () => import('@/components/build/OpenBuildDialogs.vue'),
  discardChangesDialog: () =>
    import('@/components/build/DiscardChangesDialog.vue'),
  cloudBuildConflictDialog: () =>
    import('@/components/build/CloudBuildConflictDialog.vue'),
  firstLoginOffer: () => import('@/components/account/FirstLoginOffer.vue'),
  accountDialogs: () => import('@/components/account/AccountDialogs.vue')
};

export type SurfaceName = keyof typeof surfaceLoaders;

// * Once per page load: a chunk the browser holds is not fetched again, but the loop need not run again either.
let preloadedAll = false;

// * A flag that turns on the first time its source does and never turns off again: the surface mounts on first use and stays mounted, so its close transitions and its state survive exactly as when it was in the entry bundle.
export function useOpenedOnce(source: WatchSource<boolean>) {
  const opened = ref(false);

  watch(
    source,
    (value) => {
      if (value) {
        opened.value = true;
      }
    },
    { immediate: true }
  );

  return readonly(opened);
}

export function useLazySurfaces() {
  // * Intent-driven: a pointer over or focus on a trigger fetches the chunk before the click, the stack's `bundle-preload` rule.
  function preload(...names: SurfaceName[]) {
    if (import.meta.server) {
      return;
    }

    for (const name of names) {
      void surfaceLoaders[name]();
    }
  }

  function preloadAll() {
    preload(...(Object.keys(surfaceLoaders) as SurfaceName[]));
  }

  function scheduleWhenIdle() {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(preloadAll);
      return;
    }

    setTimeout(preloadAll, IDLE_FALLBACK_MS);
  }

  // * After `load` and idle, every chunk is fetched in the background — the portraits' pattern (feature 028), so a first open on a warm page costs no request.
  function start() {
    if (preloadedAll || import.meta.server) {
      return;
    }

    preloadedAll = true;

    if (document.readyState === 'complete') {
      scheduleWhenIdle();
      return;
    }

    window.addEventListener('load', scheduleWhenIdle, { once: true });
  }

  return { preload, start };
}
