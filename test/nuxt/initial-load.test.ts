import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime';
import { afterEach, describe, expect, it, vi } from 'vitest';

import App from '@/app.vue';
import LoadingCover from '@/components/_shared/LoadingCover.vue';

import type { VueWrapper } from '@vue/test-utils';

// * Feature 023. What the cover is worth cannot be proven here: vitest's Nuxt environment mounts
// * client-side and never hydrates server HTML, so a mismatch it introduced would go unseen. The
// * absence of one is a browser walk (Verification). These tests hold the contract around it —
// * when the cover is drawn, when it lifts, and what it takes with it.

let currentPath = '/';

mockNuxtImport('useRoute', () => () => ({ path: currentPath, query: {} }));

let loadInitialBuild = vi.fn<() => Promise<void>>();

mockNuxtImport('useInitialBuild', () => () => ({
  loadInitialBuild: () => loadInitialBuild()
}));

mockNuxtImport('useUnsavedChanges', () => () => ({
  setupBeforeUnload: () => {},
  updateSavedSnapshot: () => {},
  hasUnsavedChanges: ref(false)
}));

// * The shell renders the whole planner and every dialog; none of that is this feature's subject,
// * and mounting it for real would make these tests a change detector for all of it.
const stubs = {
  NuxtPage: true,
  NuxtImg: true,
  BudgetCounters: true,
  BuildManager: true,
  AuthMenu: true,
  BuildDialogs: true,
  BuildAccountDialogs: true,
  BuildConflictDialog: true,
  FirstLoginOffer: true,
  FirstRunBanners: true,
  AccountDialogs: true,
  StorySetupDrawer: true
};

function deferred() {
  let settle!: (outcome?: unknown) => void;
  const promise = new Promise<void>((resolve, reject) => {
    settle = (outcome?: unknown) => {
      if (outcome instanceof Error) {
        reject(outcome);

        return;
      }

      resolve();
    };
  });

  return { promise, settle };
}

async function mountShell(path: string) {
  currentPath = path;

  return await mountSuspended(App, { global: { stubs } });
}

function cover(shell: VueWrapper) {
  return shell.find('[data-loading-cover]');
}

function main(shell: VueWrapper) {
  return shell.find('main');
}

afterEach(() => {
  currentPath = '/';
  loadInitialBuild = vi.fn<() => Promise<void>>();
});

describe('initial load', () => {
  it('covers the planner until the build is loaded, then lifts', async () => {
    const build = deferred();

    loadInitialBuild = vi.fn<() => Promise<void>>(() => build.promise);

    const shell = await mountShell('/');

    expect(cover(shell).exists()).toBe(true);
    expect(cover(shell).attributes('role')).toBe('progressbar');
    expect(cover(shell).attributes('aria-label')).toBe('Loading');
    expect(main(shell).attributes('inert')).toBeDefined();
    expect(main(shell).attributes('aria-busy')).toBe('true');

    build.settle();
    await nextTick();
    await nextTick();

    expect(cover(shell).exists()).toBe(false);
    expect(main(shell).attributes('inert')).toBeUndefined();
    expect(main(shell).attributes('aria-busy')).toBeUndefined();
  });

  // * The reason the lift sits in a `finally`: a local build that will not deserialize must reveal
  // * the planner, not strand the visitor behind a ring that never stops.
  it('lifts the cover even when the build fails to load', async () => {
    const build = deferred();
    const reported = vi.spyOn(console, 'error').mockImplementation(() => {});

    loadInitialBuild = vi.fn<() => Promise<void>>(() => build.promise);

    const shell = await mountShell('/');

    expect(cover(shell).exists()).toBe(true);

    build.settle(new Error('corrupt build'));
    await nextTick();
    await nextTick();

    expect(cover(shell).exists()).toBe(false);
    expect(main(shell).attributes('inert')).toBeUndefined();

    // * Caught rather than left to reject: an unhandled rejection would fail this suite, and the
    // * shell would be carrying a real one to make the point.
    expect(reported).toHaveBeenCalledOnce();

    reported.mockRestore();
  });

  it.each([
    ['/b/abc123', 'a shared build'],
    ['/privacy', 'the privacy page']
  ])('draws no cover on %s (%s)', async (path) => {
    loadInitialBuild = vi.fn<() => Promise<void>>(
      () => new Promise<void>(() => {})
    );

    const shell = await mountShell(path);

    expect(cover(shell).exists()).toBe(false);
    expect(main(shell).attributes('inert')).toBeUndefined();
    expect(main(shell).attributes('aria-busy')).toBeUndefined();
  });
});

describe('LoadingCover', () => {
  it('is an indeterminate progress mark carrying the annex ring', async () => {
    const mark = await mountSuspended(LoadingCover);

    expect(mark.attributes('role')).toBe('progressbar');
    expect(mark.attributes('aria-valuenow')).toBeUndefined();
    expect(mark.find('.loading-ring').exists()).toBe(true);
  });
});
