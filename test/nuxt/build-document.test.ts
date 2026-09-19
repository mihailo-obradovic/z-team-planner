import { describe, expect, it } from 'vitest';
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime';
import { defineComponent, h } from 'vue';

import { STAT_NAMES } from '@/types/hero';

import type { HeroStats } from '@/types/hero';
import type { SerializedBuild } from '@/types/build';
import type { PlannerState } from '@/composables/build/usePlannerState';

const FLAT_REQS = Object.fromEntries(
  STAT_NAMES.map((stat) => [stat, 5])
) as HeroStats;

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

  // ! `useState` refs are shared for the lifetime of the module, so a hero trained in one test is still trained in the next. Loading the bare document is the reset: it puts every group, the templates included, back to its default through the same path a real load takes.
  await mode.loadAccountBuild({ v: 1 });

  return {
    ...planner,
    plannerState: state,
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

    expect(planner.serializeCurrentBuild()).toEqual({
      v: 1
    });
  });

  it('omits an episode choice that is still the default', async () => {
    const planner = await freshPlanner();

    planner.ep4Hire.value = 'waterboy';

    expect(planner.serializeCurrentBuild()).toEqual({
      v: 1
    });
  });

  it('writes an episode choice that differs from the default', async () => {
    const planner = await freshPlanner();

    planner.ep3Cut.value = 'coupe';

    expect(planner.serializeCurrentBuild()).toEqual({
      v: 1,
      ec: 'coupe'
    });
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

    // * The gate checks only the keys it knows, so an unknown key is read past rather than rejected — but it is not carried forward either.
    expect(planner.ep3Cut.value).toBe('coupe');
    expect(planner.serializeCurrentBuild()).toEqual({
      v: 1,
      ec: 'coupe'
    });
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

describe('build document — mission simulator keys (feature 015)', () => {
  it('starts from the three default templates, each threshold above its own REQ', async () => {
    const planner = await freshPlanner();

    expect(planner.plannerState.missionTemplates.value).toEqual([
      {
        req: { combat: 6, intellect: 3, vigor: 5, charisma: 3, mobility: 4 },
        xp: {},
        fail: {}
      },
      {
        req: { combat: 2, intellect: 6, vigor: 3, charisma: 6, mobility: 3 },
        xp: { intellect: 8 },
        fail: {}
      },
      {
        req: { combat: 5, intellect: 3, vigor: 6, charisma: 2, mobility: 5 },
        xp: {},
        fail: { combat: 8 }
      }
    ]);
    expect(planner.serializeCurrentBuild().mt).toBeUndefined();
  });

  it('writes a threshold column as five values with 0 for unset', async () => {
    const planner = await freshPlanner();

    planner.plannerState.missionTemplates.value = [
      { req: FLAT_REQS, xp: {}, fail: {} },
      { req: FLAT_REQS, xp: { charisma: 7 }, fail: {} },
      { req: FLAT_REQS, xp: {}, fail: { combat: 8 } }
    ];

    expect(planner.serializeCurrentBuild().mt).toEqual([
      { r: [5, 5, 5, 5, 5] },
      { r: [5, 5, 5, 5, 5], x: [0, 0, 0, 7, 0] },
      { r: [5, 5, 5, 5, 5], f: [8, 0, 0, 0, 0] }
    ]);
  });

  it('omits team, synergy level and active template at their defaults', async () => {
    const planner = await freshPlanner();
    const document = planner.serializeCurrentBuild();

    expect(document.mh).toBeUndefined();
    expect(document.ml).toBeUndefined();
    expect(document.ma).toBeUndefined();
  });

  it('writes the team slots verbatim, illusion marker and empties included', async () => {
    const planner = await freshPlanner();

    planner.plannerState.missionSlots.value = [
      'golem',
      'illusion',
      null,
      'coupe'
    ];
    planner.plannerState.missionSynergyLevel.value = 2;
    planner.plannerState.missionActiveTemplate.value = 1;

    const document = planner.serializeCurrentBuild();

    expect(document.mh).toEqual(['golem', 'illusion', null, 'coupe']);
    expect(document.ml).toBe(2);
    expect(document.ma).toBe(1);
  });

  it('round-trips the mission keys exactly', async () => {
    const planner = await freshPlanner();

    planner.plannerState.missionSlots.value = ['prism', null, 'golem', null];
    planner.plannerState.missionSynergyLevel.value = 3;

    const before = planner.serializeCurrentBuild();

    await planner.loadSharedBuild(before);

    expect(planner.serializeCurrentBuild()).toEqual(before);
  });

  it('loads a shared document without templates with the defaults', async () => {
    const planner = await freshPlanner();

    planner.setMissionReq(0, 'combat', 10);
    await planner.loadSharedBuild({ v: 1 });

    expect(planner.plannerState.missionTemplates.value).toHaveLength(3);
    expect(planner.plannerState.missionTemplates.value[0]!.req.combat).toBe(6);
    expect(planner.serializeCurrentBuild()).toEqual({ v: 1 });
  });

  it('keeps edited templates through a save and load', async () => {
    const planner = await freshPlanner();

    planner.setMissionReq(1, 'vigor', 9);

    const saved = planner.serializeCurrentBuild();

    expect(saved.mt).toHaveLength(3);

    await planner.loadSharedBuild({ v: 1 });
    await planner.loadSharedBuild(saved);

    expect(planner.plannerState.missionTemplates.value[1]!.req.vigor).toBe(9);
    expect(planner.serializeCurrentBuild()).toEqual(saved);
  });

  it('sanitises loaded slots: unknown ids and duplicates empty out, ranges clamp', async () => {
    const planner = await freshPlanner();

    await planner.loadSharedBuild({
      v: 1,
      mh: ['golem', 'batman', 'golem', 'illusion'],
      ml: 9,
      ma: 9
    } as SerializedBuild);

    // * The unknown id and the duplicate empty out in deserialization; the contextless
    // * illusion marker is dropped by the team composable's sanitize watcher.
    expect(planner.plannerState.missionSlots.value).toEqual([
      'golem',
      null,
      null,
      null
    ]);
    expect(planner.plannerState.missionSynergyLevel.value).toBe(3);
    expect(planner.plannerState.missionActiveTemplate.value).toBe(2);
  });

  it('keeps condition columns on any template through a round trip', async () => {
    const planner = await freshPlanner();
    const document = {
      v: 1,
      mt: [
        { r: [5, 5, 5, 5, 5], x: [0, 7, 0, 0, 0], f: [9, 0, 0, 0, 0] },
        { r: [5, 5, 5, 5, 5] },
        { r: [5, 5, 5, 5, 5], x: [0, 0, 6, 0, 0] }
      ]
    } as SerializedBuild;

    await planner.loadSharedBuild(document);

    expect(planner.plannerState.missionTemplates.value[0]!.xp).toEqual({
      intellect: 7
    });
    expect(planner.serializeCurrentBuild().mt).toEqual(document.mt);
  });
});
