import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime';
import { defineComponent, h } from 'vue';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import BuildManager from '@/components/build/BuildManager.vue';
import { useAuthStore } from '@/stores/useAuthStore';

import type { VueWrapper } from '@vue/test-utils';
import type { LocalBuild, SerializedBuild } from '@/types/build';

// * Feature 001 as amended by 029: a `?build=` snapshot on screen, nothing open.

vi.mock('@/services/builds.api', () => ({
  fetchBuilds: vi.fn<() => Promise<unknown>>(async () => ({
    items: [],
    total: 0
  })),
  fetchBuild: vi.fn<() => Promise<never>>(),
  createBuild: vi.fn<() => Promise<never>>(),
  updateBuild: vi.fn<() => Promise<never>>(),
  deleteBuild: vi.fn<() => Promise<never>>(),
  importBuilds: vi.fn<() => Promise<never>>()
}));

mockNuxtImport('useRoute', () => () => ({ path: '/', params: {}, query: {} }));

const SNAPSHOT: SerializedBuild = { v: 1, fl: ['flambae'] };

const OWN_BUILD: LocalBuild = { id: 'own-1', name: 'Mine', data: { v: 1 } };

const STUBS = { UTooltip: { template: '<div><slot /></div>' } };

async function mountSharedMode(options: { openBefore: boolean }) {
  return await mountSuspended(
    defineComponent({
      setup() {
        useAuthStore().resetUser();
        // * A local build exists either way: Back to my build follows what was open, not what is stored.
        useState('z-team-builds').value = [OWN_BUILD];
        useState('z-team-open-build').value = options.openBefore
          ? { open: { kind: 'local', id: OWN_BUILD.id }, lastLocalId: null }
          : { open: null, lastLocalId: null };

        return () => h(BuildManager);
      }
    }),
    { global: { stubs: STUBS } }
  );
}

// * What `loadInitialBuild` does with a valid parameter, without a URL to decode.
async function openSnapshot() {
  useBuildMode().enterSharedMode();
  await deserializeBuild(SNAPSHOT, usePlannerState());
  useUnsavedChanges().updateSavedSnapshot();
}

function button(page: VueWrapper, label: RegExp) {
  return page
    .findAll('button')
    .find((candidate) =>
      label.test(candidate.attributes('aria-label') ?? candidate.text() ?? '')
    );
}

describe('shared-build mode', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('counts edits to the snapshot as unsaved work, and nothing before them', async () => {
    await mountSharedMode({ openBefore: false });
    await openSnapshot();

    const { hasUnsavedChanges } = useUnsavedChanges();

    expect(hasUnsavedChanges.value).toBe(false);

    usePlannerState().showEp8Recruits.value = true;

    // ! The defect this pins: shared-build mode read as clean whatever was edited, so the leave-site prompt never armed.
    expect(hasUnsavedChanges.value).toBe(true);
  });

  it('saves a copy in one click under the default name, with the edits, and opens it', async () => {
    const page = await mountSharedMode({ openBefore: false });

    await openSnapshot();
    usePlannerState().showEp8Recruits.value = true;
    await nextTick();

    await button(page, /^save a copy/i)!.trigger('click');

    const local = useLocalBuilds();
    const copy = local.localBuilds.value.find(
      (build) => build.id !== OWN_BUILD.id
    );

    expect(local.localBuilds.value).toHaveLength(2);
    expect(copy?.name).toBe('New build');
    expect(copy?.data).toMatchObject({ fl: ['flambae'], e8: 1 });
    expect(useOpenBuild().openLocalId.value).toBe(copy?.id);
    expect(useBuildMode().isViewingSharedBuild.value).toBe(false);
    expect(useUnsavedChanges().hasUnsavedChanges.value).toBe(false);
  });

  it('hides Back to my build when nothing was open before', async () => {
    const page = await mountSharedMode({ openBefore: false });

    await openSnapshot();
    await nextTick();

    expect(button(page, /back to my build/i)).toBeUndefined();
  });

  it('offers Back to my build when a build was open, and it reopens that one', async () => {
    const page = await mountSharedMode({ openBefore: true });

    await openSnapshot();
    await nextTick();

    await button(page, /back to my build/i)!.trigger('click');

    await vi.waitFor(() =>
      expect(useBuildMode().isViewingSharedBuild.value).toBe(false)
    );
    expect(usePlannerState().heroFlights.value).toEqual({});
    expect(useOpenBuild().openLocalId.value).toBe(OWN_BUILD.id);
  });
});
