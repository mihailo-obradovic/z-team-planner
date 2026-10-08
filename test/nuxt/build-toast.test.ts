import { mockNuxtImport } from '@nuxt/test-utils/runtime';
import { beforeEach, describe, expect, it } from 'vitest';

// * Feature 029, Toasts: every build message names the final name and where the build lives.

const toasts: { title?: string; description?: string }[] = [];

mockNuxtImport('useToast', () => () => ({
  add: (toast: { title?: string; description?: string }) => toasts.push(toast)
}));

describe('build toasts', () => {
  beforeEach(() => {
    toasts.length = 0;
  });

  it.each([
    ['saved', 'cloud', 'Saved "Main"', 'In your account'],
    ['created', 'local', 'Created "Main"', 'In this browser'],
    ['copied', 'cloud', 'Saved a copy as "Main"', 'In your account'],
    ['renamed', 'local', 'Renamed to "Main"', 'In this browser'],
    ['deleted', 'cloud', 'Deleted "Main"', 'In your account']
  ] as const)('%s in %s reads %s', (outcome, location, title, description) => {
    useBuildToast().reportBuild(outcome, 'Main', location);

    expect(toasts).toEqual([expect.objectContaining({ title, description })]);
  });
});
