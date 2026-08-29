import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime';
import { defineComponent, h } from 'vue';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import BuildManager from '@/components/_shared/BuildManager.vue';
import { useAuthStore } from '@/stores/useAuthStore';

// ! Its own file rather than another block in build-manager.test.ts. The query cache and the
// ! `useState` keys live for the whole file, so a build id used by an earlier mount is already
// ! cached — and this test is precisely about what happens on a second open of the same id.
const fetchBuildsSpy = vi.fn<() => Promise<unknown>>();
const fetchBuildSpy = vi.fn<(id: string) => Promise<unknown>>();

vi.mock('@/services/builds.api', () => ({
  fetchBuilds: () => fetchBuildsSpy(),
  fetchBuild: (id: string) => fetchBuildSpy(id),
  createBuild: vi.fn<() => Promise<never>>(),
  updateBuild: vi.fn<() => Promise<never>>(),
  deleteBuild: vi.fn<() => Promise<never>>(),
  importBuilds: vi.fn<() => Promise<never>>()
}));

mockNuxtImport('useRoute', () => () => ({ path: '/', params: {}, query: {} }));

const BUILD_ID = 'aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa';

const CLOUD_BUILD = {
  id: BUILD_ID,
  name: 'Cloud build',
  format_version: 1,
  created_at: '2026-08-26T07:00:00Z',
  updated_at: '2026-08-26T08:00:00Z',
  data: { v: 1, fl: ['flambae'] }
};

const BUILD_LIST = {
  items: [
    {
      id: CLOUD_BUILD.id,
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

describe('BuildManager reopening the account build already open', () => {
  beforeEach(() => {
    fetchBuildsSpy.mockReset();
    fetchBuildSpy.mockReset();
    fetchBuildsSpy.mockResolvedValue(BUILD_LIST);
    fetchBuildSpy.mockResolvedValue(CLOUD_BUILD);
  });

  it('reloads its document, discarding local edits', async () => {
    const page = await mountSuspended(
      defineComponent({
        setup() {
          useAuthStore().setUser({
            uid: 'u1',
            email: null,
            displayName: 'Alice'
          });
          useAuthStore().setActiveAccountBuildId(BUILD_ID);

          return () => h(BuildManager);
        }
      }),
      { global: { stubs: STUBS } }
    );

    const state = usePlannerState();

    // * The first open, through the load watcher.
    await vi.waitFor(() =>
      expect(state.heroFlights.value).toHaveProperty('flambae')
    );

    // * A local edit the player now wants to throw away by picking the build again.
    state.heroFlights.value = {};
    state.showEp8Recruits.value = true;

    const item = await vi.waitFor(() => {
      const groups = page
        .findComponent({ name: 'UDropdownMenu' })
        .props('items') as { label: string; onSelect?: () => void }[][];

      const found = groups
        .flat()
        .find((candidate) => candidate.label === CLOUD_BUILD.name);

      expect(found?.onSelect).toBeTypeOf('function');

      return found!;
    });

    item.onSelect!();

    // ! The defect this pins: selecting only wrote the active id, and re-selecting the id already
    // ! set changed neither the query key nor its data, so the load watcher never fired and the
    // ! click did nothing at all.
    await vi.waitFor(() => {
      expect(state.heroFlights.value).toHaveProperty('flambae');
      expect(state.showEp8Recruits.value).toBe(false);
    });

    // * And it lands clean: reopening is not an edit.
    expect(
      page
        .findAll('button')
        .find((candidate) =>
          /unsaved changes/i.test(candidate.attributes('aria-label') ?? '')
        )
    ).toBeUndefined();
  });
});
