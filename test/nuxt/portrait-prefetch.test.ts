import { mountSuspended } from '@nuxt/test-utils/runtime';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h } from 'vue';

import HeroPortrait from '@/components/hero/HeroPortrait.vue';

import type { PortraitUsage } from '@/config/portraits';
import type { HeroId } from '@/types/hero';

// * Feature 028: the background download waits for `load` and idle, fetches the synergy portraits before the dialog's, requests exactly what the sites render, picks the dialog's sites by viewport, and runs once per page load.

type Requested = { srcset: string; resolve: () => void };

let requested: Requested[] = [];
let idleCallbacks: (() => void)[] = [];
let readyState: DocumentReadyState = 'complete';
let viewportRem = 80;

class RecordingImage {
  fetchPriority = '';
  decoding = '';
  srcset = '';
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;

  set src(_value: string) {
    requested.push({ srcset: this.srcset, resolve: () => this.onload?.() });
  }
}

function stubMatchMedia(query: string) {
  const minRem = Number(/min-width: ([\d.]+)rem/.exec(query)?.[1] ?? 0);

  return { matches: viewportRem >= minRem } as MediaQueryList;
}

async function startPrefetch() {
  // * The `started` guard is module state, so each test imports a fresh copy.
  vi.resetModules();
  const { usePortraitPrefetch } =
    await import('@/composables/hero/usePortraitPrefetch');
  let start!: () => void;

  await mountSuspended(
    defineComponent({
      setup() {
        ({ start } = usePortraitPrefetch());

        return () => h('div');
      }
    })
  );

  return start;
}

async function renderedSrcset(heroId: HeroId, usage: PortraitUsage) {
  const mounted = await mountSuspended(HeroPortrait, {
    props: { heroId, usage, alt: heroId }
  });
  const srcset = mounted.find('img').attributes('srcset');

  mounted.unmount();

  return srcset;
}

async function settleBatch() {
  for (const request of requested) {
    request.resolve();
  }

  await new Promise((resolve) => setTimeout(resolve));
}

beforeEach(() => {
  requested = [];
  idleCallbacks = [];
  readyState = 'complete';
  viewportRem = 80;
  vi.stubGlobal('Image', RecordingImage);
  vi.stubGlobal('requestIdleCallback', (callback: () => void) =>
    idleCallbacks.push(callback)
  );
  vi.stubGlobal('matchMedia', stubMatchMedia);
  vi.spyOn(document, 'readyState', 'get').mockImplementation(() => readyState);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('portrait prefetch', () => {
  it('requests nothing before the window has loaded and the browser is idle', async () => {
    readyState = 'loading';
    const start = await startPrefetch();

    start();
    expect(idleCallbacks).toHaveLength(0);

    window.dispatchEvent(new Event('load'));
    expect(requested).toHaveLength(0);

    idleCallbacks[0]!();
    expect(requested.length).toBeGreaterThan(0);
  });

  it('fetches the synergy portraits first, then the dialog portraits', async () => {
    const start = await startPrefetch();

    start();
    idleCallbacks[0]!();

    expect(requested).toHaveLength(8);
    expect(requested[0]!.srcset).toEqual(await renderedSrcset('golem', 'card'));

    const synergyCount = requested.length;
    await settleBatch();

    expect(requested.length).toBeGreaterThan(synergyCount);
  });

  it('requests exactly the variants the dialog renders', async () => {
    const start = await startPrefetch();

    start();
    idleCallbacks[0]!();
    await settleBatch();

    const dialogSrcsets = requested.slice(8).map(({ srcset }) => srcset);

    for (const usage of ['header', 'panel', 'rail'] as const) {
      expect(dialogSrcsets).toContain(await renderedSrcset('golem', usage));
    }
  });

  it('skips the dialog sites the viewport does not show', async () => {
    viewportRem = 40;
    const start = await startPrefetch();

    start();
    idleCallbacks[0]!();
    await settleBatch();

    const dialogSrcsets = requested.slice(8).map(({ srcset }) => srcset);

    expect(dialogSrcsets).toContain(await renderedSrcset('golem', 'ribbon'));
    expect(dialogSrcsets).not.toContain(await renderedSrcset('golem', 'rail'));
    expect(dialogSrcsets).not.toContain(await renderedSrcset('golem', 'panel'));
  });

  it('runs once per page load', async () => {
    const start = await startPrefetch();

    start();
    start();

    expect(idleCallbacks).toHaveLength(1);
  });
});
