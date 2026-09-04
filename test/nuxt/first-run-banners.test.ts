import { mountSuspended } from '@nuxt/test-utils/runtime';
import { beforeEach, describe, expect, it } from 'vitest';

import FirstRunBanners from '@/components/_shared/FirstRunBanners.vue';
import { HEROES } from '@/types/hero';

import type { VueWrapper } from '@vue/test-utils';

const SPOILER_KEY = 'z-team-spoiler-acknowledged';
const STORAGE_KEY = 'z-team-storage-notice-acknowledged';

// * The test environment's localStorage is a bare object without methods (happy-dom via @nuxt/test-utils); the same Map-backed stand-in first-login-offer.test.ts installs.
const storage = new Map<string, string>();
let readsThrow = false;

Object.defineProperty(window, 'localStorage', {
  configurable: true,
  value: {
    getItem: (key: string) => {
      if (readsThrow) {
        throw new Error('storage blocked');
      }

      return storage.get(key) ?? null;
    },
    setItem: (key: string, value: string) => storage.set(key, String(value)),
    removeItem: (key: string) => storage.delete(key),
    clear: () => storage.clear()
  }
});

function labels(page: VueWrapper) {
  return page
    .findAll('[role="region"]')
    .map((region) => region.attributes('aria-label'));
}

describe('FirstRunBanners', () => {
  beforeEach(() => {
    storage.clear();
    readsThrow = false;
  });

  it('shows both banners on a first run, the spoiler warning first', async () => {
    const page = await mountSuspended(FirstRunBanners);

    expect(labels(page)).toEqual(['Spoiler warning', 'Browser storage notice']);
  });

  it('acknowledges one banner without touching the other', async () => {
    const page = await mountSuspended(FirstRunBanners);

    await page.get('button').trigger('click');

    expect(storage.get(SPOILER_KEY)).toBe('1');
    expect(storage.has(STORAGE_KEY)).toBe(false);
    expect(labels(page)).toEqual(['Browser storage notice']);
  });

  it('shows only the banner whose key is missing', async () => {
    storage.set(STORAGE_KEY, '1');

    const page = await mountSuspended(FirstRunBanners);

    expect(labels(page)).toEqual(['Spoiler warning']);
  });

  it('renders nothing once both keys are set', async () => {
    storage.set(SPOILER_KEY, '1');
    storage.set(STORAGE_KEY, '1');

    const page = await mountSuspended(FirstRunBanners);

    expect(labels(page)).toEqual([]);
  });

  it('shows both banners when storage cannot be read', async () => {
    // * Feature 017, Examples: a warning fails visible, not silent.
    readsThrow = true;

    const page = await mountSuspended(FirstRunBanners);

    expect(labels(page)).toEqual(['Spoiler warning', 'Browser storage notice']);
  });

  it('writes the key once when the same banner is confirmed twice', async () => {
    // ! The confirm button outlives the banner: it stays in the DOM for the exit animation (feature 017).
    const page = await mountSuspended(FirstRunBanners);
    const confirm = page.get('button');

    await confirm.trigger('click');
    storage.set(SPOILER_KEY, 'stale');
    await confirm.trigger('click');

    expect(storage.get(SPOILER_KEY)).toBe('stale');
  });

  it('hands focus to the banner still up', async () => {
    const page = await mountSuspended(FirstRunBanners, {
      attachTo: document.body
    });

    await page.get('button').trigger('click');
    await nextTick();

    const remaining = page.get('[data-notice="' + STORAGE_KEY + '"] button');

    expect(document.activeElement).toBe(remaining.element);
  });

  it('releases focus when no banner is left', async () => {
    storage.set(SPOILER_KEY, '1');

    const page = await mountSuspended(FirstRunBanners, {
      attachTo: document.body
    });
    const confirm = page.get('button').element as HTMLElement;

    confirm.focus();
    expect(document.activeElement).toBe(confirm);

    await page.get('button').trigger('click');
    await nextTick();

    expect(document.activeElement).not.toBe(confirm);
  });

  it('never names a hero in the spoiler warning', async () => {
    const page = await mountSuspended(FirstRunBanners);

    const spoiler = page.get('[role="region"]').text();

    for (const hero of HEROES) {
      expect(spoiler).not.toContain(hero.name);
    }
  });
});
