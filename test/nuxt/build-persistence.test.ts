import { describe, expect, it } from 'vitest';
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime';
import { defineComponent, h } from 'vue';

// Regression coverage for catalyst/features/001_build-persistence.md:
// an undecodable ?build= param must fall back to the active saved build,
// not leave the planner on defaults while the selector names the build.

const routeQuery: Record<string, string> = {};

mockNuxtImport('useRoute', () => () => ({ query: routeQuery }));

// The test environment's localStorage is a bare object without methods
// (happy-dom via @nuxt/test-utils); install a functional Map-backed stand-in
// before the composable first touches it.
const store = new Map<string, string>();

Object.defineProperty(window, 'localStorage', {
  configurable: true,
  value: {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => store.set(key, String(value)),
    removeItem: (key: string) => store.delete(key),
    clear: () => store.clear()
  }
});

const SAVED_BUILD = {
  id: 'b1',
  name: 'Saved',
  data: { v: 1, ec: 'coupe', fl: ['flambae'] },
  savedAt: 1
};

function seedActiveBuild() {
  localStorage.setItem('z-team-builds', JSON.stringify([SAVED_BUILD]));
  localStorage.setItem('z-team-active-build', JSON.stringify('b1'));
}

async function initializedPlanner() {
  let planner!: ReturnType<typeof useHeroPlanner>;

  await mountSuspended(
    defineComponent({
      setup() {
        planner = useHeroPlanner();
        return () => h('div');
      }
    })
  );

  await planner.initialize();
  return planner;
}

describe('useBuildPersistence initialize', () => {
  it('falls back to the active build when the build param is undecodable', async () => {
    seedActiveBuild();
    routeQuery.build = '%%%garbage%%%';

    const planner = await initializedPlanner();

    expect(planner.isViewingSharedBuild.value).toBe(false);
    expect(planner.ep3Cut.value).toBe('coupe');
    expect(planner.flyingHeroIds.value.has('flambae')).toBe(true);
  });

  it('falls back to the active build when the param decodes to an unknown version', async () => {
    seedActiveBuild();
    routeQuery.build = btoa(JSON.stringify({ v: 2 }));

    const planner = await initializedPlanner();

    expect(planner.isViewingSharedBuild.value).toBe(false);
    expect(planner.ep3Cut.value).toBe('coupe');
  });

  it('enters shared mode for a valid build param without touching local builds', async () => {
    seedActiveBuild();
    routeQuery.build = btoa(JSON.stringify({ v: 1, ec: 'flambae' }));

    const planner = await initializedPlanner();

    expect(planner.isViewingSharedBuild.value).toBe(true);
    expect(planner.ep3Cut.value).toBe('flambae');
    expect(localStorage.getItem('z-team-builds')).toBe(
      JSON.stringify([SAVED_BUILD])
    );
  });
});
