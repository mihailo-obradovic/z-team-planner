import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime';
import { defineComponent, h, nextTick, ref } from 'vue';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import FirstLoginOffer from '@/components/_shared/FirstLoginOffer.vue';
import { useAuthStore } from '@/stores/useAuthStore';

import type { ImportBuildsPayload } from '@/types/api';
import type { LocalBuild } from '@/types/build';

const importBuildsSpy =
  vi.fn<(payload: ImportBuildsPayload) => Promise<unknown>>();

vi.mock('@/services/builds.api', () => ({
  fetchBuilds: vi.fn<() => Promise<never>>(),
  fetchBuild: vi.fn<() => Promise<never>>(),
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

const toasts: { title?: string; description?: string }[] = [];
mockNuxtImport('useToast', () => () => ({
  add: (toast: { title?: string; description?: string }) => toasts.push(toast)
}));

const STUBS = {
  UModal: {
    props: ['open'],
    template:
      '<div v-if="open"><slot name="body" /><slot name="footer" /></div>'
  }
};

const ALICE = { uid: 'u1', email: null, displayName: 'Alice' };

function localBuild(id: string, name: string) {
  return { id, name, data: { v: 1 as const } };
}

// ! Captured from inside the component's own setup. A store or planner reached from the test body is a different instance, and every assertion here would be vacuous.
let store: ReturnType<typeof useAuthStore>;

async function mountWith(builds: ReturnType<typeof localBuild>[]) {
  const page = await mountSuspended(
    defineComponent({
      setup() {
        store = useAuthStore();
        store.resetUser();
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
  await nextTick();
  await nextTick();
}

describe('FirstLoginOffer', () => {
  beforeEach(() => {
    importBuildsSpy.mockReset();
    importBuildsSpy.mockResolvedValue([]);
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
