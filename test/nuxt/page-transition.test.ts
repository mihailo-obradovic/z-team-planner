import { describe, expect, it } from 'vitest';

// * The built config is what NuxtPage reads, so this is the line the shell actually runs on. The fade itself is walked live (feature 010, Verification).
import { appPageTransition } from '#build/nuxt.config.mjs';

describe('page transition', () => {
  it('lets a page arrive with the tab fade, out-in', () => {
    expect(appPageTransition).toEqual({
      enterActiveClass: 'tab-fade',
      mode: 'out-in'
    });
  });

  it('leaves the planner to its own tab fade', () => {
    const planner = useRouter()
      .getRoutes()
      .find((route) => route.path === '/');

    expect(planner?.meta.pageTransition).toEqual({ css: false });
  });
});
