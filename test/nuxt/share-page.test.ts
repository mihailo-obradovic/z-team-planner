import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime';
import { defineComponent, h } from 'vue';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import App from '@/app.vue';
import { useAuthStore } from '@/stores/useAuthStore';

import type { VueWrapper } from '@vue/test-utils';

// * Feature 007 (Save a copy, the header) and 029 (the planner set aside and restored).

const fetchSharedBuildSpy = vi.fn<(id: string) => Promise<unknown>>();
const createBuildSpy = vi.fn<(payload: unknown) => Promise<unknown>>();
const navigateToSpy = vi.fn<(to: string) => void>();

let leaveGuard: (() => Promise<void> | void) | null = null;

vi.mock('@/services/shared.api', () => ({
  fetchSharedBuild: (id: string) => fetchSharedBuildSpy(id)
}));

vi.mock('@/services/builds.api', () => ({
  fetchBuilds: vi.fn<() => Promise<unknown>>(async () => ({
    items: [],
    total: 0
  })),
  fetchBuild: vi.fn<() => Promise<never>>(),
  createBuild: (payload: unknown) => createBuildSpy(payload),
  updateBuild: vi.fn<() => Promise<never>>(),
  deleteBuild: vi.fn<() => Promise<never>>(),
  importBuilds: vi.fn<() => Promise<never>>()
}));

let currentId = '';

mockNuxtImport('useRoute', () => () => ({
  path: `/b/${currentId}`,
  params: { id: currentId },
  query: {}
}));

mockNuxtImport('navigateTo', () => (to: string) => {
  navigateToSpy(to);
});

// * The page is mounted outside a router view, so its leave guard is captured and run by hand.
mockNuxtImport('onBeforeRouteLeave', () => (guard: () => Promise<void>) => {
  leaveGuard = guard;
});

const SharedBuildPage = (await import('@/pages/b/[id].vue')).default;

const SHARED_DATA = { v: 1 as const, fl: ['flambae'] };

// * A fresh id per test: the shared query is cached by id for the whole file.
let idCounter = 0;

function nextId() {
  idCounter += 1;

  return `0000000${idCounter}-1111-4111-8111-111111111111`;
}

async function mountPage(options: { signedIn: boolean; dirty: boolean }) {
  currentId = nextId();
  fetchSharedBuildSpy.mockResolvedValue({
    id: currentId,
    name: 'Shared main',
    data: SHARED_DATA,
    updated_at: '2026-08-26T08:00:00Z'
  });

  const page = await mountSuspended(
    defineComponent({
      setup() {
        const auth = useAuthStore();

        if (options.signedIn) {
          auth.setUser({ uid: 'u1', email: null, displayName: 'Alice' });
        } else {
          auth.resetUser();
        }

        // * A test that ends on the page leaves its set-aside behind; a real visit always leaves through the guard.
        useState('planner-set-aside').value = null;
        useState('z-team-builds').value = [];
        useState('z-team-open-build').value = { open: null, lastLocalId: null };

        const state = usePlannerState();

        state.heroFlights.value = {};
        state.showEp8Recruits.value = false;
        useUnsavedChanges().updateSavedSnapshot();

        // * The visitor's own edit, made before following the link.
        if (options.dirty) {
          state.showEp8Recruits.value = true;
        }

        return () => h(SharedBuildPage);
      }
    }),
    { global: { stubs: { UTooltip: { template: '<div><slot /></div>' } } } }
  );

  await vi.waitFor(() =>
    expect(usePlannerState().heroFlights.value).toHaveProperty('flambae')
  );

  return page;
}

function saveCopyButton(page: VueWrapper) {
  return page
    .findAll('button')
    .find((button) => button.text().includes('Save a copy'))!;
}

describe('the share page and the visitor’s planner', () => {
  beforeEach(() => {
    fetchSharedBuildSpy.mockReset();
    createBuildSpy.mockReset();
    navigateToSpy.mockReset();
    leaveGuard = null;
  });

  it('sets the planner aside without entering shared-build mode, and hands it back on leave', async () => {
    await mountPage({ signedIn: false, dirty: true });

    expect(useBuildMode().isViewingSharedBuild.value).toBe(false);
    // * What is at stake is still the visitor's own unsaved edit.
    expect(useUnsavedChanges().hasUnsavedChanges.value).toBe(true);

    await leaveGuard!();

    const state = usePlannerState();

    expect(state.heroFlights.value).toEqual({});
    expect(state.showEp8Recruits.value).toBe(true);
    expect(useUnsavedChanges().hasUnsavedChanges.value).toBe(true);
  });

  it('saves a copy to this browser signed out and lands on / with it open', async () => {
    const page = await mountPage({ signedIn: false, dirty: false });

    await saveCopyButton(page).trigger('click');

    const local = useLocalBuilds();

    expect(local.localBuilds.value.map((build) => build.name)).toEqual([
      'Shared main'
    ]);
    expect(local.localBuilds.value[0]!.data).toEqual(SHARED_DATA);
    expect(useOpenBuild().openLocalId.value).toBe(
      local.localBuilds.value[0]!.id
    );
    await vi.waitFor(() => expect(navigateToSpy).toHaveBeenCalledWith('/'));

    // * Leaving after a copy restores nothing: the copy stays on screen, clean.
    await leaveGuard!();
    expect(usePlannerState().heroFlights.value).toHaveProperty('flambae');
    expect(useUnsavedChanges().hasUnsavedChanges.value).toBe(false);
  });

  it('saves a copy to the account signed in with one request however often it is clicked', async () => {
    const page = await mountPage({ signedIn: true, dirty: false });
    const createdId = 'cccccccc-3333-4333-8333-cccccccccccc';

    createBuildSpy.mockResolvedValue({
      id: createdId,
      name: 'Shared main (2)',
      format_version: 1,
      created_at: '2026-08-26T07:00:00Z',
      updated_at: '2026-08-26T08:00:00Z',
      data: SHARED_DATA
    });

    await saveCopyButton(page).trigger('click');
    await saveCopyButton(page).trigger('click');

    await vi.waitFor(() => expect(navigateToSpy).toHaveBeenCalledWith('/'));
    expect(createBuildSpy).toHaveBeenCalledTimes(1);
    expect(useOpenBuild().openCloudId.value).toBe(createdId);
  });

  it('stays on the page, ready again, when the copy fails', async () => {
    const page = await mountPage({ signedIn: true, dirty: false });

    createBuildSpy.mockRejectedValue({
      statusCode: 409,
      data: { error: { code: 'build_limit', message: 'Limit.' } }
    });

    await saveCopyButton(page).trigger('click');
    await vi.waitFor(() => expect(createBuildSpy).toHaveBeenCalledTimes(1));
    await vi.waitFor(() =>
      expect(saveCopyButton(page).attributes('disabled')).toBeUndefined()
    );

    expect(navigateToSpy).not.toHaveBeenCalled();
    expect(useOpenBuild().openBuild.value).toBeNull();
  });

  it('asks before a copy replaces unsaved work', async () => {
    const page = await mountPage({ signedIn: false, dirty: true });

    await saveCopyButton(page).trigger('click');

    expect(useDiscardGuard().discardOpen.value).toBe(true);
    expect(useLocalBuilds().localBuilds.value).toHaveLength(0);

    useDiscardGuard().closeDiscard();
  });
});

describe('the header on a share page', () => {
  it('shows no build controls and no Story setup', async () => {
    currentId = nextId();

    const shell = await mountSuspended(App, {
      global: {
        stubs: {
          UTooltip: { template: '<div><slot /></div>' },
          NuxtPage: true,
          NuxtImg: true,
          BudgetCounters: true,
          BuildManager: true,
          AuthMenu: true,
          StorySetupButton: true,
          LocalBuildDialogs: true,
          CloudBuildDialogs: true,
          OpenBuildDialogs: true,
          DiscardChangesDialog: true,
          CloudBuildConflictDialog: true,
          FirstLoginOffer: true,
          FirstRunBanners: true,
          AccountDialogs: true,
          StorySetupDrawer: true
        }
      }
    });

    // * Non-vacuous: the stubs that should remain do render.
    expect(shell.findComponent({ name: 'AuthMenu' }).exists()).toBe(true);
    expect(shell.findComponent({ name: 'BudgetCounters' }).exists()).toBe(true);
    expect(shell.findComponent({ name: 'BuildManager' }).exists()).toBe(false);
    expect(shell.findComponent({ name: 'StorySetupButton' }).exists()).toBe(
      false
    );
  });
});
