import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime';
import { flushPromises } from '@vue/test-utils';
import { defineComponent, h, nextTick, ref } from 'vue';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import FirstLoginOffer from '@/components/account/FirstLoginOffer.vue';
import { clearUserScopedCache } from '@/services/queries/clearUserScopedCache';
import { useAuthStore } from '@/stores/useAuthStore';

import type {
  CloudBuild,
  CloudBuildList,
  ImportBuildsPayload
} from '@/types/api';
import type { LocalBuild, SerializedBuild } from '@/types/build';

const importBuildsSpy =
  vi.fn<(payload: ImportBuildsPayload) => Promise<unknown>>();

type CloudFixture = { id: string; name: string; data: SerializedBuild };

// * What the account already holds. The list carries no documents, so each build is also served by id, the way the server answers.
const cloudBuilds: CloudFixture[] = [];
const failingReads = { list: false, build: false };

function cloudRow({ id, name, data }: CloudFixture): CloudBuild {
  return {
    id,
    name,
    data,
    format_version: 1,
    created_at: '2026-10-01T00:00:00Z',
    updated_at: '2026-10-01T00:00:00Z'
  };
}

const fetchBuildsSpy = vi.fn<() => Promise<CloudBuildList>>(async () => {
  if (failingReads.list) {
    throw { statusCode: 500 };
  }

  return {
    items: cloudBuilds.map((build) => {
      const { data: _data, ...summary } = cloudRow(build);

      return summary;
    }),
    total: cloudBuilds.length
  };
});

const fetchBuildSpy = vi.fn<(id: string) => Promise<CloudBuild>>(async (id) => {
  const found = cloudBuilds.find((build) => build.id === id);

  if (failingReads.build || !found) {
    throw { statusCode: 500 };
  }

  return cloudRow(found);
});

vi.mock('@/services/builds.api', () => ({
  fetchBuilds: () => fetchBuildsSpy(),
  fetchBuild: (id: string) => fetchBuildSpy(id),
  createBuild: vi.fn<() => Promise<never>>(),
  updateBuild: vi.fn<() => Promise<never>>(),
  deleteBuild: vi.fn<() => Promise<never>>(),
  importBuilds: (payload: ImportBuildsPayload) => importBuildsSpy(payload)
}));

mockNuxtImport('useRoute', () => () => ({ path: '/', params: {}, query: {} }));

// * `useLocalBuilds` exposes `localBuilds` as a readonly computed, so the local builds are supplied here rather than written through it. The component reads nothing else from the planner.
const localBuilds = ref<LocalBuild[]>([]);
mockNuxtImport('useLocalBuilds', () => () => ({ localBuilds }));

// * The test environment's localStorage is a bare object without methods (happy-dom via @nuxt/test-utils); the same Map-backed stand-in build-persistence.test.ts installs.
const storage = new Map<string, string>();

Object.defineProperty(window, 'localStorage', {
  configurable: true,
  value: {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, String(value)),
    removeItem: (key: string) => storage.delete(key),
    clear: () => storage.clear()
  }
});

type Toast = { title?: string; description?: string; color?: string };

const toasts: Toast[] = [];
mockNuxtImport('useToast', () => () => ({
  add: (toast: Toast) => toasts.push(toast)
}));

const STUBS = {
  UModal: {
    props: ['open'],
    template:
      '<div v-if="open"><slot name="body" /><slot name="footer" /></div>'
  }
};

const ALICE = { uid: 'u1', email: null, displayName: 'Alice' };

function localBuild(
  id: string,
  name: string,
  data: SerializedBuild = { v: 1 }
) {
  return { id, name, data };
}

// ! Captured from inside the component's own setup. A store or planner reached from the test body is a different instance, and every assertion here would be vacuous.
let store: ReturnType<typeof useAuthStore>;

async function mountWith(builds: ReturnType<typeof localBuild>[]) {
  const page = await mountSuspended(
    defineComponent({
      setup() {
        store = useAuthStore();
        store.resetUser();
        // * What signing out does in the app: no account's list outlives its session.
        clearUserScopedCache();
        localBuilds.value = builds;

        return () => h(FirstLoginOffer);
      }
    }),
    { global: { stubs: STUBS } }
  );

  return page;
}

async function signIn() {
  store.setUser(ALICE);
  await flushPromises();
  await nextTick();
}

describe('FirstLoginOffer', () => {
  beforeEach(() => {
    importBuildsSpy.mockReset();
    importBuildsSpy.mockResolvedValue([]);
    fetchBuildsSpy.mockClear();
    fetchBuildSpy.mockClear();
    cloudBuilds.length = 0;
    failingReads.list = false;
    failingReads.build = false;
    window.localStorage.clear();
    toasts.length = 0;
  });

  it('offers every local build, all selected', async () => {
    const page = await mountWith([
      localBuild('a', 'Main squad'),
      localBuild('b', 'Tank line')
    ]);

    await signIn();

    expect(page.text()).toContain('Main squad');
    expect(page.text()).toContain('Tank line');
    // * All selected, so keeping everything is one click and dropping one is deliberate.
    const boxes = page.findAll('[role="checkbox"]');
    expect(boxes.map((box) => box.attributes('aria-checked'))).toEqual([
      'true',
      'true'
    ]);

    page.unmount();
  });

  it('does not offer anything when the browser holds no builds', async () => {
    const page = await mountWith([]);

    await signIn();

    expect(page.text()).toBe('');

    page.unmount();
  });

  it('keeps only what is still checked', async () => {
    const page = await mountWith([
      localBuild('a', 'Main squad'),
      localBuild('b', 'Tank line')
    ]);
    await signIn();

    const boxes = page.findAll('[role="checkbox"]');
    await boxes[1]?.trigger('click');

    const keep = page
      .findAll('button')
      .find((button) => button.text() === 'Keep selected');
    await keep?.trigger('click');

    await vi.waitFor(() => expect(importBuildsSpy).toHaveBeenCalledOnce());
    expect(importBuildsSpy.mock.calls[0]?.[0]).toEqual({
      builds: [{ name: 'Main squad', data: { v: 1 } }]
    });

    page.unmount();
  });

  it('reports which builds the server refused', async () => {
    importBuildsSpy.mockResolvedValue([
      {
        index: 0,
        status: 'created',
        id: crypto.randomUUID(),
        name: 'Main squad'
      },
      { index: 1, status: 'invalid', errors: [{ path: 'data', message: 'no' }] }
    ]);

    const page = await mountWith([
      localBuild('a', 'Main squad'),
      localBuild('b', 'Tank line')
    ]);
    await signIn();

    const keep = page
      .findAll('button')
      .find((button) => button.text() === 'Keep selected');
    await keep?.trigger('click');

    await vi.waitFor(() => expect(toasts).toHaveLength(1));
    expect(toasts[0]?.title).toBe('1 build kept');
    // * Named, not counted: the player has to know which build to go and look at.
    expect(toasts[0]?.description).toBe('Could not import: Tank line');

    page.unmount();
  });

  it('leaves out the builds the account already holds', async () => {
    cloudBuilds.push(
      { id: crypto.randomUUID(), name: 'Main', data: { v: 1, ec: 'coupe' } },
      { id: crypto.randomUUID(), name: 'Tank', data: { v: 1 } }
    );

    const page = await mountWith([
      // * Already kept: same name, same document, keys in another order.
      localBuild('a', 'Main', { ec: 'coupe', v: 1 } as SerializedBuild),
      // * Same name, another document: a different build, so still offered.
      localBuild('b', 'Tank', { v: 1, ec: 'coupe' }),
      // * Same document, another name: also still offered.
      localBuild('c', 'Scout', { v: 1, ec: 'coupe' })
    ]);
    await signIn();

    expect(page.text()).not.toContain('Main');
    expect(page.text()).toContain('Tank');
    expect(page.text()).toContain('Scout');
    expect(page.text()).toContain('You have 2 builds saved in this browser');
    // * Only the name-matched builds are read in full; one per collision, never the whole account.
    expect(fetchBuildSpy).toHaveBeenCalledTimes(2);

    page.unmount();
  });

  it('offers nothing, and stays unanswered, when every build is already kept', async () => {
    cloudBuilds.push({ id: crypto.randomUUID(), name: 'Main', data: { v: 1 } });

    const first = await mountWith([localBuild('a', 'Main')]);
    await signIn();

    expect(first.text()).toBe('');
    first.unmount();

    // ! Nothing was answered, so a build made here later is still offered on the next sign-in.
    const later = await mountWith([
      localBuild('a', 'Main'),
      localBuild('b', 'New')
    ]);
    await signIn();

    expect(later.text()).toContain('New');
    expect(later.text()).not.toContain('Main');
    later.unmount();
  });

  it('offers nothing when the account list cannot be read', async () => {
    failingReads.list = true;

    const failed = await mountWith([localBuild('a', 'Main')]);
    await signIn();

    expect(failed.text()).toBe('');
    failed.unmount();

    failingReads.list = false;

    const retried = await mountWith([localBuild('a', 'Main')]);
    await signIn();

    expect(retried.text()).toContain('Main');
    retried.unmount();
  });

  it('offers nothing when a matched build cannot be read', async () => {
    cloudBuilds.push({ id: crypto.randomUUID(), name: 'Main', data: { v: 1 } });
    failingReads.build = true;

    const page = await mountWith([
      localBuild('a', 'Main'),
      localBuild('b', 'New')
    ]);
    await signIn();

    // * An offer that might list a kept build is the defect itself, so none is shown.
    expect(page.text()).toBe('');

    page.unmount();
  });

  it('counts builds the account already held apart from the kept ones', async () => {
    importBuildsSpy.mockResolvedValue([
      { index: 0, status: 'created', id: crypto.randomUUID(), name: 'Main' },
      { index: 1, status: 'existing', id: crypto.randomUUID(), name: 'Tank' }
    ]);

    const page = await mountWith([
      localBuild('a', 'Main'),
      localBuild('b', 'Tank')
    ]);
    await signIn();

    const keep = page
      .findAll('button')
      .find((button) => button.text() === 'Keep selected');
    await keep?.trigger('click');

    await vi.waitFor(() => expect(toasts).toHaveLength(1));
    expect(toasts[0]).toMatchObject({
      title: '1 build kept',
      description: '1 was already in your account',
      color: 'success'
    });

    page.unmount();
  });

  it('says so when every build was already in the account', async () => {
    importBuildsSpy.mockResolvedValue([
      { index: 0, status: 'existing', id: crypto.randomUUID(), name: 'Main' }
    ]);

    const page = await mountWith([localBuild('a', 'Main')]);
    await signIn();

    const keep = page
      .findAll('button')
      .find((button) => button.text() === 'Keep selected');
    await keep?.trigger('click');

    await vi.waitFor(() => expect(toasts).toHaveLength(1));
    expect(toasts[0]).toMatchObject({
      title: 'Already in your account',
      color: 'success'
    });
    expect(toasts[0]?.description).toBeUndefined();

    page.unmount();
  });

  it('is answered once per browser, whichever way it is answered', async () => {
    const builds = [localBuild('a', 'Main squad')];

    const first = await mountWith(builds);
    await signIn();

    const dismiss = first
      .findAll('button')
      .find((button) => button.text() === 'Not now');
    await dismiss?.trigger('click');
    expect(first.text()).toBe('');
    first.unmount();

    // * A second browser session: same storage, a fresh sign-in.
    const second = await mountWith(builds);
    await signIn();

    expect(second.text()).toBe('');
    expect(importBuildsSpy).not.toHaveBeenCalled();

    second.unmount();
  });

  it('survives an import that fails, and is spent once one succeeds', async () => {
    const builds = [localBuild('a', 'Main squad')];

    importBuildsSpy.mockRejectedValue({ statusCode: 500 });

    const failed = await mountWith(builds);
    await signIn();

    const keep = failed
      .findAll('button')
      .find((button) => button.text() === 'Keep selected');
    await keep?.trigger('click');

    await vi.waitFor(() => expect(importBuildsSpy).toHaveBeenCalledTimes(1));

    // ! The defect this pins: the offer was spent before the import was attempted, so a 500 or a
    // ! moment offline cost this browser the offer permanently and imported nothing.
    expect(failed.text()).toContain('Main squad');
    failed.unmount();

    // * Next sign-in: still offered, and this time it lands.
    importBuildsSpy.mockResolvedValue([
      {
        index: 0,
        status: 'created',
        id: crypto.randomUUID(),
        name: 'Main squad'
      }
    ]);

    const retried = await mountWith(builds);
    await signIn();

    expect(retried.text()).toContain('Main squad');

    const retryKeep = retried
      .findAll('button')
      .find((button) => button.text() === 'Keep selected');
    await retryKeep?.trigger('click');

    await vi.waitFor(() => expect(importBuildsSpy).toHaveBeenCalledTimes(2));
    await vi.waitFor(() => expect(retried.text()).toBe(''));
    retried.unmount();

    // * Spent now: a success is an answer.
    const after = await mountWith(builds);
    await signIn();

    expect(after.text()).toBe('');
    after.unmount();
  });
});
