import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime';
import { afterEach, describe, expect, it, vi } from 'vitest';

import App from '@/app.vue';
import LoadingRing from '@/components/_shared/LoadingRing.vue';

import type { VueWrapper } from '@vue/test-utils';

// * Feature 023. What the wait is worth cannot be proven here: vitest's Nuxt environment mounts
// * client-side and never hydrates server HTML, so a mismatch it introduced would go unseen. The
// * absence of one is a browser walk (Verification). These tests hold the contract around it —
// * when the app waits, when it stops, and what it withholds meanwhile.
// * The planner's own hiding is a stylesheet rule keyed off the flag, so the flag is what is
// * asserted here; happy-dom loads no stylesheet and could not see the effect either way.

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

function ring(shell: VueWrapper) {
  return shell.find('[data-loading-ring]');
}

function withheld(shell: VueWrapper) {
  return shell.find('[data-boot-withheld]');
}

function booting() {
  return document.documentElement.getAttribute('data-booting');
}

// * unhead writes `<html>` attributes on a timer of its own rather than Vue's tick, so the flag
// * is polled for rather than read once. It is asserted as `'false'`, never as absent: removal is
// * exactly what does not reach the DOM for an attribute that came from SSR.
async function bootFlag(expected: 'true' | 'false') {
  await vi.waitFor(() => {
    expect(booting()).toBe(expected);
  });
}

afterEach(() => {
  currentPath = '/';
  loadInitialBuild = vi.fn<() => Promise<void>>();
});

describe('initial load', () => {
  it('withholds the page until the build is loaded, then reveals it', async () => {
    const build = deferred();

    loadInitialBuild = vi.fn<() => Promise<void>>(() => build.promise);

    const shell = await mountShell('/');

    expect(ring(shell).exists()).toBe(true);
    expect(ring(shell).attributes('role')).toBe('progressbar');
    expect(ring(shell).attributes('aria-label')).toBe('Loading');
    await bootFlag('true');
    expect(withheld(shell).exists()).toBe(true);
    expect(shell.findComponent({ name: 'FirstRunBanners' }).exists()).toBe(
      false
    );

    build.settle();
    await nextTick();
    await nextTick();

    expect(ring(shell).exists()).toBe(false);
    await bootFlag('false');
    expect(shell.findComponent({ name: 'FirstRunBanners' }).exists()).toBe(
      true
    );
  });

  // * The reason the end of the wait sits in a `finally`: a local build that will not deserialize
  // * must reveal the planner, not strand the visitor behind a ring that never stops.
  it('ends the wait even when the build fails to load', async () => {
    const build = deferred();
    const reported = vi.spyOn(console, 'error').mockImplementation(() => {});

    loadInitialBuild = vi.fn<() => Promise<void>>(() => build.promise);

    const shell = await mountShell('/');

    expect(ring(shell).exists()).toBe(true);

    build.settle(new Error('corrupt build'));
    await nextTick();
    await nextTick();

    expect(ring(shell).exists()).toBe(false);
    await bootFlag('false');

    // * Caught rather than left to reject: an unhandled rejection would fail this suite, and the
    // * shell would be carrying a real one to make the point.
    expect(reported).toHaveBeenCalledOnce();

    reported.mockRestore();
  });

  it.each([
    ['/b/abc123', 'a shared build'],
    ['/privacy', 'the privacy page']
  ])('never waits on %s (%s)', async (path) => {
    loadInitialBuild = vi.fn<() => Promise<void>>(
      () => new Promise<void>(() => {})
    );

    const shell = await mountShell(path);

    expect(ring(shell).exists()).toBe(false);
    await bootFlag('false');
    expect(withheld(shell).exists()).toBe(true);
  });
});

describe('LoadingRing', () => {
  it('is an indeterminate progress mark carrying the annex ring', async () => {
    const mark = await mountSuspended(LoadingRing);

    expect(mark.attributes('role')).toBe('progressbar');
    expect(mark.attributes('aria-valuenow')).toBeUndefined();
    expect(mark.find('.loading-ring').exists()).toBe(true);
  });
});
