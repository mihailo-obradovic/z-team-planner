import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime';
import { defineComponent, h } from 'vue';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import BuildManager from '@/components/build/BuildManager.vue';
import { useAuthStore } from '@/stores/useAuthStore';

import type { VueWrapper } from '@vue/test-utils';

const fetchBuildsSpy = vi.fn<() => Promise<unknown>>();
const fetchBuildSpy = vi.fn<(id: string) => Promise<unknown>>();
const updateBuildSpy = vi.fn<() => Promise<unknown>>();

vi.mock('@/services/builds.api', () => ({
  fetchBuilds: () => fetchBuildsSpy(),
  fetchBuild: (id: string) => fetchBuildSpy(id),
  createBuild: vi.fn<() => Promise<never>>(),
  updateBuild: () => updateBuildSpy(),
  deleteBuild: vi.fn<() => Promise<never>>(),
  importBuilds: vi.fn<() => Promise<never>>()
}));

mockNuxtImport('useRoute', () => () => ({ path: '/', params: {}, query: {} }));

const CLOUD_ID = 'bbbbbbbb-2222-4222-8222-bbbbbbbbbbbb';

const CLOUD_BUILD = {
  id: CLOUD_ID,
  name: 'Cloud A',
  format_version: 1,
  created_at: '2026-08-26T07:00:00Z',
  updated_at: '2026-08-26T08:00:00Z',
  data: { v: 1, fl: ['flambae'] }
};

const BUILD_LIST = {
  items: [
    {
      id: CLOUD_ID,
      name: CLOUD_BUILD.name,
      format_version: 1,
      created_at: CLOUD_BUILD.created_at,
      updated_at: CLOUD_BUILD.updated_at
    }
  ],
  total: 1
};

const STUBS = {
  UTooltip: { template: '<div><slot /></div>' },
  UDropdownMenu: {
    name: 'UDropdownMenu',
    props: ['items'],
    template: '<div><slot /></div>'
  }
};

type MenuItem = { label: string; checked?: boolean; onSelect?: () => void };

function menuItems(page: Awaited<ReturnType<typeof mountSuspended>>) {
  return (
    page.findComponent({ name: 'UDropdownMenu' }).props('items') as MenuItem[][]
  ).flat();
}

describe('the open build', () => {
  beforeEach(() => {
    fetchBuildsSpy.mockReset();
    fetchBuildSpy.mockReset();
    updateBuildSpy.mockReset();
    fetchBuildsSpy.mockResolvedValue(BUILD_LIST);
    fetchBuildSpy.mockResolvedValue(CLOUD_BUILD);
    localStorage.clear();
  });

  it('is the local build after one is opened over a cloud build, so Save never patches the cloud one', async () => {
    const page = await mountSuspended(
      defineComponent({
        setup() {
          useAuthStore().setUser({ uid: 'u1', email: null, displayName: 'A' });
          // * What `app.vue` installs: it loads a cloud build picked from the menu.
          useOpenBuildSync();

          const { saveAsNewLocalBuild } = useLocalBuilds();

          usePlannerState().showEp8Recruits.value = true;
          saveAsNewLocalBuild('Local B');

          return () => h(BuildManager);
        }
      }),
      { global: { stubs: STUBS } }
    );

    const state = usePlannerState();

    const cloudItem = await vi.waitFor(() => {
      const found = menuItems(page).find((item) => item.label === 'Cloud A');

      expect(found?.onSelect).toBeTypeOf('function');

      return found!;
    });

    cloudItem.onSelect!();

    await vi.waitFor(() =>
      expect(state.heroFlights.value).toHaveProperty('flambae')
    );

    const localItem = menuItems(page).find((item) => item.label === 'Local B');

    await localItem!.onSelect!();

    await vi.waitFor(() => expect(state.showEp8Recruits.value).toBe(true));

    // * One open build: only "Local B" is ticked, and the header names it.
    const ticked = menuItems(page).filter((item) => item.checked);

    expect(ticked.map((item) => item.label)).toEqual(['Local B']);

    // * An edit, then Save.
    state.showEp8Recruits.value = false;
    await nextTick();

    const save = page
      .findAll('button')
      .find((button) => /^save/i.test(button.attributes('aria-label') ?? ''));

    await save!.trigger('click');
    await new Promise((resolve) => setTimeout(resolve, 30));

    // ! The defect this pins: opening a local build left the cloud id active, so Save PATCHed "Cloud A" with "Local B"'s data.
    expect(updateBuildSpy).not.toHaveBeenCalled();

    const stored = JSON.parse(
      localStorage.getItem('z-team-builds') ?? '[]'
    ) as {
      name: string;
      data: { e8?: boolean };
    }[];

    expect(
      stored.find((build) => build.name === 'Local B')?.data.e8
    ).toBeUndefined();

    page.unmount();
  });
});

// * Feature 029: the reload paint, the fetched replacement, the owner check, a vanished build, and sign-out.
// ! The auth store is one Pinia for this whole file, so each mount states the account it starts with rather than inheriting the last test's.

const LOCAL_BUILD = {
  id: 'local-1',
  name: 'Local',
  data: { v: 1, ec: 'coupe' }
};

const CACHED = { v: 1, fl: ['flambae'] };

let auth!: ReturnType<typeof useAuthStore>;

// ! The query cache is shared by the file too: a build id an earlier test fetched answers from its leftover entry, so every mount opens its own.
let restoredId = '';
let restoredCount = 0;

function nextRestoredId() {
  restoredCount += 1;

  return `dddddddd-${String(restoredCount).padStart(4, '0')}-4444-8444-dddddddddddd`;
}

// ! Each mount keeps its watchers and its query alive until unmounted; one left behind keeps fetching into the shared planner state and reacting to the next test's record.
const mounted: { unmount: () => void }[] = [];

afterEach(() => {
  mounted.splice(0).forEach((page) => page.unmount());
});

// * A fetch answered by hand, after the reload's paint, as a real network would.
function deferredFetch() {
  let answer!: (build: unknown) => void;
  let fail!: (error: unknown) => void;

  fetchBuildSpy.mockReturnValue(
    new Promise((resolve, reject) => {
      answer = resolve;
      fail = reject;
    })
  );

  return {
    answer: (build: unknown) => answer(build),
    fail: (e: unknown) => fail(e)
  };
}

async function mountRestored(seed: { account: string | null; uid?: string }) {
  restoredId = nextRestoredId();

  const page = await mountSuspended(
    defineComponent({
      setup() {
        auth = useAuthStore();
        // * The test app has no API URL, which reads as a deployment without sign-in; these tests are about one with it.
        auth.setSignInAvailability('available');
        auth.setUser({
          uid: seed.account ?? 'u1',
          email: null,
          displayName: 'A'
        });

        if (!seed.account) {
          auth.resetUser();
        }

        useState('z-team-builds').value = [LOCAL_BUILD];
        useState('z-team-open-build').value = {
          open: {
            kind: 'cloud',
            id: restoredId,
            uid: seed.uid ?? 'u1',
            document: CACHED
          },
          lastLocalId: LOCAL_BUILD.id
        };
        useState('planner-set-aside').value = null;
        useBuildMode().leaveSharedMode();

        const state = usePlannerState();

        state.heroFlights.value = {};
        state.showEp8Recruits.value = false;
        state.ep3Cut.value = 'golem';
        useOpenBuildSync();

        return () => h(BuildManager);
      }
    }),
    { global: { stubs: STUBS } }
  );

  mounted.push(page);
  await useInitialBuild().loadInitialBuild();

  return page;
}

function storedRecord() {
  return JSON.parse(localStorage.getItem('z-team-open-build') ?? 'null') as {
    open: { kind: string } | null;
  };
}

function saveButton(page: VueWrapper) {
  return page
    .findAll('button')
    .find((button) =>
      /^(save|sign in to save)/i.test(button.attributes('aria-label') ?? '')
    );
}

const FELL_BACK = {
  openLocalId: LOCAL_BUILD.id,
  ep3Cut: 'coupe',
  heroFlights: {},
  // * The cloud entry, cached document included, is gone from the browser.
  storedKind: 'local'
};

// * What the planner looks like once it has settled on the last local build.
async function settledOnLocal() {
  await vi.waitFor(() =>
    expect(useOpenBuild().openLocalId.value).toBe(LOCAL_BUILD.id)
  );
  await vi.waitFor(() => expect(usePlannerState().ep3Cut.value).toBe('coupe'));

  return {
    openLocalId: useOpenBuild().openLocalId.value,
    ep3Cut: usePlannerState().ep3Cut.value,
    heroFlights: usePlannerState().heroFlights.value,
    storedKind: storedRecord().open?.kind
  };
}

describe('the open build across a reload', () => {
  beforeEach(() => {
    fetchBuildsSpy.mockReset();
    fetchBuildSpy.mockReset();
    fetchBuildsSpy.mockResolvedValue(BUILD_LIST);
  });

  it('paints a cloud build from its cache before the account answers', async () => {
    deferredFetch();

    await mountRestored({ account: 'u1' });

    expect(usePlannerState().heroFlights.value).toHaveProperty('flambae');
    expect(useUnsavedChanges().hasUnsavedChanges.value).toBe(false);
  });

  it('replaces the painted build with the fetched one while the planner is untouched', async () => {
    const fetch = deferredFetch();

    await mountRestored({ account: 'u1' });
    fetch.answer({ ...CLOUD_BUILD, id: restoredId, data: { v: 1, e8: 1 } });

    await vi.waitFor(() =>
      expect(usePlannerState().showEp8Recruits.value).toBe(true)
    );
    expect(usePlannerState().heroFlights.value).toEqual({});
    expect(useUnsavedChanges().hasUnsavedChanges.value).toBe(false);
  });

  it('keeps an edit made before the fetch answers', async () => {
    const fetch = deferredFetch();

    await mountRestored({ account: 'u1' });
    usePlannerState().heroFlights.value = {};
    fetch.answer({ ...CLOUD_BUILD, id: restoredId, data: { v: 1, e8: 1 } });
    await new Promise((resolve) => setTimeout(resolve, 30));

    expect(usePlannerState().showEp8Recruits.value).toBe(false);
    expect(usePlannerState().heroFlights.value).toEqual({});
    expect(useOpenBuild().openCloudId.value).toBe(restoredId);
  });

  it('ignores a cache another user wrote and opens the last local build', async () => {
    deferredFetch();

    await mountRestored({ account: 'u1', uid: 'someone-else' });

    expect(await settledOnLocal()).toEqual(FELL_BACK);
  });

  it('falls back when nobody is signed in at load', async () => {
    await mountRestored({ account: null });

    expect(await settledOnLocal()).toEqual(FELL_BACK);
  });

  it('falls back when the remembered build is gone', async () => {
    const fetch = deferredFetch();

    await mountRestored({ account: 'u1' });
    fetch.fail({
      statusCode: 404,
      data: { error: { code: 'not_found', message: 'Build not found.' } }
    });

    expect(await settledOnLocal()).toEqual(FELL_BACK);
  });
});

describe('the open build across a sign-out', () => {
  beforeEach(() => {
    fetchBuildsSpy.mockReset();
    fetchBuildSpy.mockReset();
    fetchBuildsSpy.mockResolvedValue(BUILD_LIST);
  });

  async function signedInWithEdit() {
    const fetch = deferredFetch();
    const page = await mountRestored({ account: 'u1' });

    fetch.answer({ ...CLOUD_BUILD, id: restoredId, data: CACHED });
    await new Promise((resolve) => setTimeout(resolve, 30));

    usePlannerState().showEp8Recruits.value = true;
    await nextTick();

    return page;
  }

  it('falls back to the last local build when the user chose to sign out', async () => {
    await signedInWithEdit();

    auth.chooseSignOut();
    auth.resetUser();

    expect(await settledOnLocal()).toEqual(FELL_BACK);
  });

  it('keeps the cloud build and its edits when the session ended, and Save asks for a sign-in', async () => {
    const page = await signedInWithEdit();
    const storedBuilds = localStorage.getItem('z-team-builds');

    auth.resetUser();
    await nextTick();

    expect(useOpenBuild().openCloudId.value).toBe(restoredId);
    expect(usePlannerState().showEp8Recruits.value).toBe(true);
    expect(saveButton(page)?.attributes('aria-label')).toMatch(
      /^Sign in to save/
    );
    // * Nothing is written to this browser meanwhile.
    expect(localStorage.getItem('z-team-builds')).toBe(storedBuilds);
  });
});

describe('the open cloud build’s cache', () => {
  beforeEach(() => {
    fetchBuildsSpy.mockReset();
    fetchBuildSpy.mockReset();
    fetchBuildsSpy.mockResolvedValue(BUILD_LIST);
  });

  it('is written for a new build whose document matches the one before', async () => {
    deferredFetch();
    await mountRestored({ account: 'u1' });

    const { openLocal, openCloud, openCloudEntry } = useOpenBuild();

    openLocal(LOCAL_BUILD.id);
    await nextTick();

    // * What a create does: open the new build and baseline the planner on the document sent, here the same text as before.
    const createdId = nextRestoredId();

    openCloud(createdId);
    useUnsavedChanges().updateSavedSnapshot();
    await nextTick();

    // ! The defect this pins: the cache followed only a change in the baseline's text, so this build reloaded with nothing to paint.
    expect(openCloudEntry.value?.document).not.toBeNull();
  });
});
