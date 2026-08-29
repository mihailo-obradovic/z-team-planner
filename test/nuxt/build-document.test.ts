import { describe, expect, it } from 'vitest';
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime';
import { defineComponent, h } from 'vue';

import type { SerializedBuild } from '@/types/build';
import type { PlannerState } from '@/composables/usePlannerState';

// * Characterisation coverage for the build document format — the protected area feature 001 owns.
// * Written against the planner's public surface rather than the serialiser, because the serialiser is module-private and takes eight refs. That is the point: these assertions describe the format, not the code that produces it, so decision 006's split has to leave every one of them passing.

const routeQuery: Record<string, string> = {};

mockNuxtImport('useRoute', () => () => ({ query: routeQuery }));

// * The test environment's localStorage is a bare object without methods; install a Map-backed stand-in before the composable first touches it.
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

// * `getShareUrl` reads window.location, which happy-dom leaves as about:blank.
Object.defineProperty(window, 'location', {
  configurable: true,
  value: new URL('https://planner.test/')
});

// * The persistence concerns are separate composables, so the harness composes the surface these assertions were written against. The assertions themselves are untouched — that is the point of a characterisation test.
async function freshPlanner() {
  store.clear();
  delete routeQuery.build;

  let planner!: ReturnType<typeof useHeroPlanner>;
  let state!: PlannerState;
  let mode!: ReturnType<typeof useBuildMode>;
  let sharing!: ReturnType<typeof useBuildSharing>;
  let initial!: ReturnType<typeof useInitialBuild>;

  await mountSuspended(
    defineComponent({
      setup() {
        planner = useHeroPlanner();
        state = usePlannerState();
        mode = useBuildMode();
        sharing = useBuildSharing();
        initial = useInitialBuild();

        return () => h('div');
      }
    })
  );

  await initial.loadInitialBuild();

  // ! `useState` refs are shared for the lifetime of the module, so a hero trained in one test is still trained in the next. Loading an empty document is the reset: it puts every group back to `{}` and both episode choices back to their defaults, through the same path a real load takes.
  await mode.loadAccountBuild({ v: 1 });

  return {
    ...planner,
    serializeCurrentBuild: () => serializeBuild(state),
    loadSharedBuild: mode.loadSharedBuild,
    getShareUrl: sharing.getShareUrl
  };
}

function decodeShareParam(url: string): SerializedBuild {
  const encoded = new URL(url).searchParams.get('build') as string;
  const padded = encoded.replace(/-/g, '+').replace(/_/g, '/');

  return JSON.parse(atob(padded));
}

describe('build document — what the format omits', () => {
  it('serialises an untouched planner to the version alone', async () => {
    const planner = await freshPlanner();

    expect(planner.serializeCurrentBuild()).toEqual({ v: 1 });
  });

  it('omits an episode choice that is still the default', async () => {
    const planner = await freshPlanner();

    planner.ep4Hire.value = 'waterboy';

    expect(planner.serializeCurrentBuild()).toEqual({ v: 1 });
  });

  it('writes an episode choice that differs from the default', async () => {
    const planner = await freshPlanner();

    planner.ep3Cut.value = 'coupe';

    expect(planner.serializeCurrentBuild()).toEqual({ v: 1, ec: 'coupe' });
  });

  it('writes the episode 8 flag only when it is on', async () => {
    const planner = await freshPlanner();

    expect(planner.serializeCurrentBuild().e8).toBeUndefined();

    planner.showEp8Recruits.value = true;

    expect(planner.serializeCurrentBuild().e8).toBe(1);
  });

  it('omits a hero whose allocations are all zero', async () => {
    const planner = await freshPlanner();

    planner.statUp('coupe', 'combat');
    planner.statDown('coupe', 'combat');

    expect(planner.serializeCurrentBuild().lu).toBeUndefined();
  });
});

describe('build document — how each group is shaped', () => {
  it('writes level-ups as a stat array in STAT_NAMES order', async () => {
    const planner = await freshPlanner();

    planner.statUp('coupe', 'intellect');

    // * combat, intellect, vigor, charisma, mobility
    expect(planner.serializeCurrentBuild().lu).toEqual({
      coupe: [0, 1, 0, 0, 0]
    });
  });

  it('writes bonus levels as a plain count', async () => {
    const planner = await freshPlanner();

    planner.addBonusLevel('coupe');

    expect(planner.serializeCurrentBuild().bl).toEqual({ coupe: 1 });
  });

  it('writes a power selection as a [revealed, selected] pair', async () => {
    const planner = await freshPlanner();

    planner.toggleStartingPower('coupe');

    expect(planner.serializeCurrentBuild().pw).toEqual({ coupe: [1, 0] });
  });

  it('writes flight as a bare list of hero ids', async () => {
    const planner = await freshPlanner();

    // * Only FLIGHT_SCHOOL_HEROES can be toggled, and only two of them at once.
    planner.toggleFlight('flambae');

    expect(planner.serializeCurrentBuild().fl).toEqual(['flambae']);
  });

  it('leaves flight out entirely when nothing is trained', async () => {
    const planner = await freshPlanner();

    // * A hero outside flight school is a no-op rather than an entry.
    planner.toggleFlight('golem');

    expect(planner.serializeCurrentBuild().fl).toBeUndefined();
  });
});

describe('build document — round trip', () => {
  it('reloading a serialised document reproduces it exactly', async () => {
    const planner = await freshPlanner();

    planner.ep3Cut.value = 'coupe';
    planner.showEp8Recruits.value = true;
    planner.statUp('golem', 'vigor');
    planner.addBonusLevel('golem');
    planner.toggleStartingPower('golem');

    const before = planner.serializeCurrentBuild();

    await planner.loadSharedBuild(before);

    expect(planner.serializeCurrentBuild()).toEqual(before);
  });

  it('survives a document carrying a key this client does not know', async () => {
    const planner = await freshPlanner();

    await planner.loadSharedBuild({
      v: 1,
      ec: 'coupe',
      zz: 'from a later client'
    } as SerializedBuild);

    // * Feature 001's contract is backward compatibility, so an unknown key is read past rather than rejected — but it is not carried forward either.
    expect(planner.ep3Cut.value).toBe('coupe');
    expect(planner.serializeCurrentBuild()).toEqual({ v: 1, ec: 'coupe' });
  });
});

describe('build document — url codec', () => {
  it('round-trips the current build through the share parameter', async () => {
    const planner = await freshPlanner();

    planner.ep3Cut.value = 'coupe';
    planner.statUp('golem', 'charisma');

    expect(decodeShareParam(planner.getShareUrl())).toEqual(
      planner.serializeCurrentBuild()
    );
  });

  it('encodes with the url-safe alphabet and no padding', async () => {
    const planner = await freshPlanner();

    planner.ep3Cut.value = 'coupe';
    planner.statUp('golem', 'mobility');
    planner.toggleStartingPower('golem');

    const encoded = new URL(planner.getShareUrl()).searchParams.get(
      'build'
    ) as string;

    // * A `+`, `/` or `=` here would survive URL.searchParams but break any consumer that does not re-encode.
    expect(encoded).not.toMatch(/[+/=]/);
  });
});
