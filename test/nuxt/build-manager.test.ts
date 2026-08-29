import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime';
import { defineComponent, h } from 'vue';

import type { VueWrapper } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import BuildManager from '@/components/_shared/BuildManager.vue';
import { useAuthStore } from '@/stores/useAuthStore';

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

const ACCOUNT_BUILDS = {
  items: [
    {
      id: 'aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa',
      name: 'Cloud build',
      format_version: 1,
      created_at: '2026-08-26T07:00:00Z',
      updated_at: '2026-08-26T08:00:00Z'
    }
  ],
  total: 1,
  page: 1,
  page_size: 20
};

// * BuildManager renders <u-tooltip>, which needs UApp's TooltipProvider. Stubbing the tooltip is enough here and keeps the mount shallow — these tests are about which requests the component triggers, not about tooltip behaviour.
const STUBS = {
  UTooltip: { template: '<div><slot /></div>' },
  UDropdownMenu: {
    name: 'UDropdownMenu',
    props: ['items'],
    template: '<div><slot /></div>'
  }
};

function signIn() {
  // ! Called inside a component setup, so it is the component's own Pinia. A store created in the test body is a different instance and every assertion here would be vacuous.
  useAuthStore().setUser({ uid: 'u1', email: null, displayName: 'Alice' });
}

describe('BuildManager account list', () => {
  beforeEach(() => {
    fetchBuildsSpy.mockReset();
    fetchBuildSpy.mockReset();
    fetchBuildsSpy.mockResolvedValue(ACCOUNT_BUILDS);
  });

  it('requests no account builds while signed out', async () => {
    const page = await mountSuspended(BuildManager, {
      global: { stubs: STUBS }
    });
    await new Promise((resolve) => setTimeout(resolve, 60));

    // * Guard against a vacuous pass: the component really rendered.
    expect(page.html()).toContain('button');

    // * Feature 006, Examples: a signed-out load makes no API request at all.
    expect(fetchBuildsSpy).not.toHaveBeenCalled();
  });

  it('fetches the account list once signed in', async () => {
    await mountSuspended(
      defineComponent({
        setup() {
          signIn();

          return () => h(BuildManager);
        }
      }),
      { global: { stubs: STUBS } }
    );

    await vi.waitFor(() => expect(fetchBuildsSpy).toHaveBeenCalled());
  });

  it('renders the account build name in the selector', async () => {
    const page = await mountSuspended(
      defineComponent({
        setup() {
          signIn();

          return () => h(BuildManager);
        }
      }),
      { global: { stubs: STUBS } }
    );

    // * The account builds are the dropdown's `items` prop, not markup — they only become markup once the menu opens. No spy assertion either: the list is already cached under the same key from the test above, so this mount legitimately serves it from cache.
    await vi.waitFor(() => {
      const menu = page.findComponent({ name: 'UDropdownMenu' });
      const groups = menu.props('items') as { label: string }[][];

      expect(groups.flat().map((item) => item.label)).toContain('Cloud build');
    });
  });
});

describe('BuildManager share', () => {
  const written: string[] = [];

  beforeEach(() => {
    written.length = 0;
    fetchBuildsSpy.mockReset();
    fetchBuildsSpy.mockResolvedValue(ACCOUNT_BUILDS);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: (text: string) => {
          written.push(text);

          return Promise.resolve();
        }
      }
    });
  });

  async function share(withAccountBuild: boolean) {
    const page = await mountSuspended(
      defineComponent({
        setup() {
          signIn();
          // ! Set both ways round: the store outlives a mount, so leaving it alone would carry the previous test's account build into this one and pass vacuously.
          useAuthStore().setActiveAccountBuildId(
            withAccountBuild ? ACCOUNT_BUILDS.items[0]!.id : null
          );

          return () => h(BuildManager);
        }
      }),
      { global: { stubs: STUBS } }
    );

    const button = page
      .findAll('button')
      .find((candidate) => /share/i.test(candidate.text()));

    expect(button, 'the share control rendered').toBeTruthy();
    await button!.trigger('click');
    await vi.waitFor(() => expect(written).toHaveLength(1));

    return written[0]!;
  }

  it('copies the live link for an account build', async () => {
    // ! Feature 005: an account build shares as /b/{id}, which always shows the owner's current document. A ?build= snapshot would freeze whatever was on screen.
    expect(await share(true)).toContain(`/b/${ACCOUNT_BUILDS.items[0]!.id}`);
  });

  it('copies a snapshot for a local build', async () => {
    // * A local build has no id on the server, so the URL has to carry the whole document.
    const url = await share(false);

    expect(url).toContain('?build=');
    expect(url).not.toContain('/b/');
  });
});

// * The cloud build the planner is opened onto. Round-trip stable through the serialiser: `fl`
// * carries only flight-trained heroes, so deserialising and reserialising returns these bytes.
// ! Its own id, not the list's: the share tests above already mounted with that id, so its
// ! `['builds','get',id]` entry is cached and this block's mock would never be reached.
const CLOUD_BUILD = {
  ...ACCOUNT_BUILDS.items[0]!,
  id: 'bbbbbbbb-2222-4222-8222-bbbbbbbbbbbb',
  data: { v: 1, fl: ['flambae'] }
};

const LOCAL_BUILD = { id: 'local-1', name: 'Local build', data: { v: 1 } };

// * Save carries its state in its accessible name (annex §13), so that is what dirtiness is read
// * from here rather than a fill colour.
function findDirtySave(page: VueWrapper) {
  return page
    .findAll('button')
    .find((candidate) =>
      /unsaved changes/i.test(candidate.attributes('aria-label') ?? '')
    );
}

describe('BuildManager dirty state across the two worlds', () => {
  beforeEach(() => {
    fetchBuildsSpy.mockReset();
    fetchBuildSpy.mockReset();
    updateBuildSpy.mockReset();
    fetchBuildsSpy.mockResolvedValue(ACCOUNT_BUILDS);
    fetchBuildSpy.mockResolvedValue(CLOUD_BUILD);
    updateBuildSpy.mockResolvedValue(CLOUD_BUILD);
  });

  // ! Each call takes its own id. A repeated id is served from the query cache, `data` keeps its
  // ! identity, and the load watcher never fires — which is defect A3, not something to lean on.
  async function openCloudBuild(id: string) {
    const build = { ...CLOUD_BUILD, id };

    fetchBuildSpy.mockResolvedValue(build);

    const page = await mountSuspended(
      defineComponent({
        setup() {
          signIn();
          useAuthStore().setActiveAccountBuildId(id);

          // ! Seeded through the state refs, not localStorage: `useLocalStorageRef` reads storage
          // ! once per key per app, and an earlier mount in this file already claimed both keys.
          // ! A local build has to exist or Save renders unconditionally on `length === 0`, and
          // ! every assertion about Save's absence below would pass vacuously.
          useState<unknown[]>('z-team-builds').value = [LOCAL_BUILD];
          useState<string | null>('z-team-active-build').value = LOCAL_BUILD.id;

          // ! `useState` outlives a mount, so the planner carries the previous test's edits in.
          const state = usePlannerState();
          state.showEp8Recruits.value = false;
          state.heroFlights.value = {};

          return () => h(BuildManager);
        }
      }),
      { global: { stubs: STUBS } }
    );

    // * Non-vacuous: the cloud document really reached the planner before anything is asserted.
    await vi.waitFor(() =>
      expect(usePlannerState().heroFlights.value).toHaveProperty('flambae')
    );

    return page;
  }

  it('leaves the planner clean after opening a cloud build', async () => {
    const page = await openCloudBuild(CLOUD_BUILD.id);

    // ! The defect this pins: dirty tracking was baselined only by the local-build paths, so a
    // ! freshly opened cloud build read as unsaved the instant it finished loading, and the
    // ! unload guard prompted on a build with nothing to lose.
    expect(findDirtySave(page)).toBeUndefined();
  });

  it('returns the planner to clean after a successful save to the account', async () => {
    const page = await openCloudBuild('cccccccc-3333-4333-8333-cccccccccccc');

    usePlannerState().showEp8Recruits.value = true;
    await vi.waitFor(() => expect(findDirtySave(page)).toBeTruthy());

    await findDirtySave(page)!.trigger('click');
    await vi.waitFor(() => expect(updateBuildSpy).toHaveBeenCalled());

    // * Baselined against the document that was sent, so what succeeded is what clean means.
    await vi.waitFor(() => expect(findDirtySave(page)).toBeUndefined());
  });
});
