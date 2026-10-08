import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime';
import { defineComponent, h } from 'vue';

import type { VueWrapper } from '@vue/test-utils';
import type { LocalBuild } from '@/types/build';
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

// * `useState` is global to this file's Nuxt app and outlives a mount, so a test that cares about
// * dirtiness has to start from a known planner rather than the previous test's leftovers.
function resetPlanner() {
  const state = usePlannerState();

  state.showEp8Recruits.value = false;
  state.heroFlights.value = {};
}

function signIn() {
  // ! Called inside a component setup, so it is the component's own Pinia. A store created in the test body is a different instance and every assertion here would be vacuous.
  useAuthStore().setUser({ uid: 'u1', email: null, displayName: 'Alice' });
}

// ! First in the file on purpose: the auth store is one Pinia per file and has no way back to `unknown`, so only the first mount sees it.
describe('BuildManager while the account is unknown (feature 029)', () => {
  it('holds Save until it knows where a build would go', async () => {
    fetchBuildsSpy.mockResolvedValue(ACCOUNT_BUILDS);

    const page = await mountSuspended(
      defineComponent({
        setup() {
          // * The test app has no API URL, which reads as a deployment without sign-in, where nothing waits.
          useAuthStore().setSignInAvailability('available');

          return () => h(BuildManager);
        }
      }),
      { global: { stubs: STUBS } }
    );

    expect(useAuthStore().status).toBe('unknown');

    const save = page
      .findAll('button')
      .find((button) =>
        /^save to/i.test(button.attributes('aria-label') ?? '')
      );

    expect(save?.attributes('disabled')).toBeDefined();

    page.unmount();
  });
});

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
    fetchBuildSpy.mockReset();
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
          if (withAccountBuild) {
            // * Opened as the menu opens one, so `useOpenBuildSync` (installed by `app.vue`) loads it.
            useOpenBuild().openCloud(ACCOUNT_BUILDS.items[0]!.id);
            useOpenBuild().requestedCloudId.value = ACCOUNT_BUILDS.items[0]!.id;
            useOpenBuildSync();
          } else {
            useOpenBuild().closeBuild();
          }

          // ! These two cover the clean path. Share on a *dirty* account build saves first and is
          // ! covered below, so the planner has to be baselined or this exercises that path
          // ! instead — `useState` carries the previous test's edits in.
          resetPlanner();
          useUnsavedChanges().updateSavedSnapshot();

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

const LOCAL_BUILD: LocalBuild = {
  id: 'local-1',
  name: 'Local build',
  data: { v: 1 }
};

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
          // * Opened as the menu opens one, so `useOpenBuildSync` (installed by `app.vue`) loads it.
          useOpenBuild().openCloud(id);
          useOpenBuild().requestedCloudId.value = id;
          useOpenBuildSync();

          // ! Seeded through the state ref, not localStorage: `useLocalStorageRef` reads storage
          // ! once per key per app, and an earlier mount in this file already claimed the key.
          // ! The cloud build is opened before the mount: with nothing open Save renders
          // ! unconditionally, and every assertion about Save's absence below would pass vacuously.
          useState<unknown[]>('z-team-builds').value = [LOCAL_BUILD];

          resetPlanner();

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

describe('BuildManager sharing an account build with unsaved changes', () => {
  const written: string[] = [];

  beforeEach(() => {
    written.length = 0;
    fetchBuildsSpy.mockReset();
    fetchBuildSpy.mockReset();
    updateBuildSpy.mockReset();
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

  // ! Its own id per call, for the reason `openCloudBuild` gives: a repeated id is served from the
  // ! query cache and the load watcher never fires.
  async function shareDirty(id: string, overrideMocks?: () => void) {
    const build = { ...CLOUD_BUILD, id };

    fetchBuildSpy.mockResolvedValue(build);
    updateBuildSpy.mockResolvedValue(build);
    overrideMocks?.();

    const page = await mountSuspended(
      defineComponent({
        setup() {
          signIn();
          // * Opened as the menu opens one, so `useOpenBuildSync` (installed by `app.vue`) loads it.
          useOpenBuild().openCloud(id);
          useOpenBuild().requestedCloudId.value = id;
          useOpenBuildSync();
          useState<unknown[]>('z-team-builds').value = [LOCAL_BUILD];
          resetPlanner();

          return () => h(BuildManager);
        }
      }),
      { global: { stubs: STUBS } }
    );

    await vi.waitFor(() =>
      expect(usePlannerState().heroFlights.value).toHaveProperty('flambae')
    );

    usePlannerState().showEp8Recruits.value = true;
    await vi.waitFor(() => expect(findDirtySave(page)).toBeTruthy());

    const share = page
      .findAll('button')
      .find((candidate) => /share/i.test(candidate.text()));

    expect(share, 'the share control rendered').toBeTruthy();
    await share!.trigger('click');

    return page;
  }

  it('saves the build before copying its live link', async () => {
    const id = 'dddddddd-4444-4444-8444-dddddddddddd';

    await shareDirty(id);

    // ! The defect this pins: /b/{id} resolves to the stored document, so copying without saving
    // ! handed out a link to a build the sharer was not looking at.
    await vi.waitFor(() => expect(updateBuildSpy).toHaveBeenCalled());
    await vi.waitFor(() => expect(written).toHaveLength(1));
    expect(written[0]).toContain(`/b/${id}`);
  });

  it('copies nothing when that save fails', async () => {
    await shareDirty('eeeeeeee-5555-4555-8555-eeeeeeeeeeee', () => {
      updateBuildSpy.mockRejectedValue({ statusCode: 500 });
    });

    await vi.waitFor(() => expect(updateBuildSpy).toHaveBeenCalled());
    // * A stale link is worse than no link: the failure is the central policy's to report.
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(written).toHaveLength(0);
  });
});

type MenuItem = {
  label: string;
  type?: string;
  icon?: string;
  onSelect?: () => void;
};

function menuGroups(page: VueWrapper) {
  return page
    .findComponent({ name: 'UDropdownMenu' })
    .props('items') as MenuItem[][];
}

function menuLabels(page: VueWrapper) {
  return menuGroups(page)
    .flat()
    .map((item) => item.label);
}

function findSave(page: VueWrapper) {
  return page
    .findAll('button')
    .find((candidate) =>
      /^save to/i.test(candidate.attributes('aria-label') ?? '')
    );
}

describe('BuildManager menu and Save (feature 029)', () => {
  beforeEach(() => {
    fetchBuildsSpy.mockReset();
    fetchBuildSpy.mockReset();
    fetchBuildsSpy.mockResolvedValue(ACCOUNT_BUILDS);
  });

  // * Every piece of build state lives in `useState` for the whole file, so each mount starts from a stated one.
  async function mountWith(options: {
    signedIn: boolean;
    localBuilds: LocalBuild[];
    openLocalId: string | null;
  }) {
    const page = await mountSuspended(
      defineComponent({
        setup() {
          if (options.signedIn) {
            signIn();
          } else {
            useAuthStore().resetUser();
          }

          useState('z-team-builds').value = options.localBuilds;
          useState('z-team-open-build').value = {
            open: options.openLocalId
              ? { kind: 'local', id: options.openLocalId }
              : null,
            lastLocalId: options.openLocalId
          };
          resetPlanner();
          useUnsavedChanges().updateSavedSnapshot();

          return () => h(BuildManager);
        }
      }),
      { global: { stubs: STUBS } }
    );

    await vi.waitFor(() => expect(menuGroups(page).length).toBeGreaterThan(0));

    return page;
  }

  it('leaves out the local group when there are no local builds, so no separator frames an empty box', async () => {
    const page = await mountWith({
      signedIn: true,
      localBuilds: [],
      openLocalId: null
    });

    await vi.waitFor(() =>
      expect(menuLabels(page)).not.toContain('Loading your builds...')
    );

    // * Two groups: the account's builds and the actions — no local group, empty or otherwise.
    expect(menuGroups(page)).toHaveLength(2);
    expect(menuGroups(page).every((group) => group.length > 0)).toBe(true);
    expect(menuLabels(page)).toEqual([
      'Cloud build',
      'New build',
      'Save as new...'
    ]);
  });

  it('offers one Rename and one Delete, for the open build', async () => {
    const page = await mountWith({
      signedIn: false,
      localBuilds: [LOCAL_BUILD],
      openLocalId: LOCAL_BUILD.id
    });

    const labels = menuLabels(page);

    expect(labels.filter((label) => label === 'Rename...')).toHaveLength(1);
    expect(labels.filter((label) => label === 'Delete...')).toHaveLength(1);
  });

  it('hides Save while the open build is clean and shows it on an edit, naming the destination', async () => {
    const page = await mountWith({
      signedIn: false,
      localBuilds: [LOCAL_BUILD],
      openLocalId: LOCAL_BUILD.id
    });

    expect(findSave(page)).toBeUndefined();

    usePlannerState().showEp8Recruits.value = true;

    await vi.waitFor(() =>
      expect(findSave(page)?.attributes('aria-label')).toBe(
        'Save to this browser — unsaved changes'
      )
    );
  });

  it('shows Save with nothing open, naming the account when signed in', async () => {
    const page = await mountWith({
      signedIn: true,
      localBuilds: [],
      openLocalId: null
    });

    expect(findSave(page)?.attributes('aria-label')).toMatch(
      /^Save to your account/
    );
  });

  it('marks a local build open while signed in as only in this browser', async () => {
    const page = await mountWith({
      signedIn: true,
      localBuilds: [LOCAL_BUILD],
      openLocalId: LOCAL_BUILD.id
    });

    expect(menuLabels(page)).toContain('This build is only in this browser');

    const select = page
      .findAllComponents({ name: 'UButton' })
      .find((button) => button.props('label') === LOCAL_BUILD.name);

    expect(select?.props('icon')).toBe('i-lucide-monitor');
  });

  it('leaves nothing open after deleting the open build, and Save offers its name back', async () => {
    const page = await mountWith({
      signedIn: false,
      localBuilds: [LOCAL_BUILD],
      openLocalId: LOCAL_BUILD.id
    });

    useLocalBuilds().deleteLocalBuild(LOCAL_BUILD.id);

    expect(useOpenBuild().openBuild.value).toBeNull();
    // * The deleted build's contents are still on screen with nothing behind them: unsaved work.
    expect(useUnsavedChanges().hasUnsavedChanges.value).toBe(true);

    await vi.waitFor(() => expect(findSave(page)).toBeTruthy());
    await findSave(page)!.trigger('click');

    const { saveAsNewOpen, saveAsNewName } = useDialogs();

    expect(saveAsNewOpen.value).toBe(true);
    expect(saveAsNewName.value).toBe(LOCAL_BUILD.name);
  });

  it('opens a blank planner as a new local build when signed out', async () => {
    const page = await mountWith({
      signedIn: false,
      localBuilds: [LOCAL_BUILD],
      openLocalId: LOCAL_BUILD.id
    });

    usePlannerState().showEp8Recruits.value = true;

    menuGroups(page)
      .flat()
      .find((item) => item.label === 'New build')!.onSelect!();
    // * The edit above is unsaved work, so New build asks first.
    useDiscardGuard().confirmDiscard();

    await vi.waitFor(() =>
      expect(useOpenBuild().openLocalId.value).not.toBe(LOCAL_BUILD.id)
    );

    expect(usePlannerState().showEp8Recruits.value).toBe(false);
    expect(useLocalBuilds().activeBuildName.value).toBe('New build');
  });
});

describe('BuildManager discard confirmation (feature 029)', () => {
  const OTHER_BUILD: LocalBuild = {
    id: 'local-2',
    name: 'Other build',
    data: { v: 1, fl: ['flambae'] }
  };

  beforeEach(() => {
    fetchBuildsSpy.mockReset();
    fetchBuildsSpy.mockResolvedValue(ACCOUNT_BUILDS);
  });

  async function mountDirty() {
    const page = await mountSuspended(
      defineComponent({
        setup() {
          useAuthStore().resetUser();
          useState('z-team-builds').value = [LOCAL_BUILD, OTHER_BUILD];
          useState('z-team-open-build').value = {
            open: { kind: 'local', id: LOCAL_BUILD.id },
            lastLocalId: LOCAL_BUILD.id
          };
          resetPlanner();
          useUnsavedChanges().updateSavedSnapshot();

          return () => h(BuildManager);
        }
      }),
      { global: { stubs: STUBS } }
    );

    usePlannerState().showEp8Recruits.value = true;
    await nextTick();

    return page;
  }

  function select(page: VueWrapper, label: string) {
    menuGroups(page)
      .flat()
      .find((item) => item.label === label)!.onSelect!();
  }

  it('asks before opening another build over unsaved changes, and Cancel keeps everything', async () => {
    const page = await mountDirty();
    const guard = useDiscardGuard();

    select(page, OTHER_BUILD.name);

    expect(guard.discardOpen.value).toBe(true);
    // * Nothing replaced yet: the edit and the open build are as they were.
    expect(useOpenBuild().openLocalId.value).toBe(LOCAL_BUILD.id);
    expect(usePlannerState().showEp8Recruits.value).toBe(true);

    guard.closeDiscard();
    await nextTick();

    expect(useOpenBuild().openLocalId.value).toBe(LOCAL_BUILD.id);
    expect(usePlannerState().showEp8Recruits.value).toBe(true);
  });

  it('opens the other build once the discard is confirmed', async () => {
    const page = await mountDirty();
    const guard = useDiscardGuard();

    select(page, OTHER_BUILD.name);
    guard.confirmDiscard();

    await vi.waitFor(() =>
      expect(usePlannerState().heroFlights.value).toHaveProperty('flambae')
    );
    expect(useOpenBuild().openLocalId.value).toBe(OTHER_BUILD.id);
    expect(guard.discardOpen.value).toBe(false);
  });

  it('asks before New build too', async () => {
    const page = await mountDirty();

    select(page, 'New build');

    expect(useDiscardGuard().discardOpen.value).toBe(true);
    useDiscardGuard().closeDiscard();
  });
});
