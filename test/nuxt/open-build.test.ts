import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime';
import { defineComponent, h } from 'vue';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import BuildManager from '@/components/build/BuildManager.vue';
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

  it('closes a cloud build on sign-out and keeps it across an ordinary user update', async () => {
    let openBuild!: ReturnType<typeof useOpenBuild>;
    let auth!: ReturnType<typeof useAuthStore>;

    await mountSuspended(
      defineComponent({
        setup() {
          auth = useAuthStore();
          openBuild = useOpenBuild();
          openBuild.watchSignOut();

          auth.setUser({ uid: 'u1', email: null, displayName: 'A' });
          openBuild.openCloud(CLOUD_ID);

          return () => h('div');
        }
      })
    );

    auth.setUser({ uid: 'u1', email: null, displayName: 'A B' });
    await nextTick();

    expect(openBuild.openCloudId.value).toBe(CLOUD_ID);

    auth.resetUser();
    await nextTick();

    // * It names a build only that account could open; keeping it would point the planner at something the next visitor cannot load.
    expect(openBuild.openBuild.value).toBeNull();
  });
});
