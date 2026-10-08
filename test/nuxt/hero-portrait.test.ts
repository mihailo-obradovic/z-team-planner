import { mountSuspended } from '@nuxt/test-utils/runtime';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import HeroPortrait from '@/components/hero/HeroPortrait.vue';

// * Feature 021: a usage site names its width once and gets an x1/x2 srcset at exactly that width, at the one quality and format, from the hero's own master. IPX serves the test environment, so the URLs are its `/_ipx/<modifiers>/<path>` form.

let mounted: Awaited<ReturnType<typeof mountSuspended>> | null = null;

afterEach(() => {
  mounted?.unmount();
  mounted = null;
});

async function mountPortrait(
  props: InstanceType<typeof HeroPortrait>['$props']
) {
  mounted = await mountSuspended(HeroPortrait, { props });

  return mounted.find('img');
}

describe('HeroPortrait', () => {
  it('requests the usage width at 1x and twice it at 2x', async () => {
    const img = await mountPortrait({
      heroId: 'coupe',
      usage: 'card',
      alt: 'Coupe'
    });
    const srcset = img.attributes('srcset') ?? '';

    expect(img.attributes('src')).toContain('w_108');
    expect(srcset).toMatch(/w_108[^,]*coupe\.webp 1x/);
    expect(srcset).toMatch(/w_216[^,]*coupe\.webp 2x/);
    expect(img.attributes('alt')).toBe('Coupe');
  });

  it('carries the one quality and format for every portrait', async () => {
    const img = await mountPortrait({
      heroId: 'golem',
      usage: 'header',
      alt: 'Golem'
    });

    expect(img.attributes('src')).toContain('q_90');
    expect(img.attributes('src')).toContain('f_avif');
    expect(img.attributes('src')).toContain('w_24');
  });

  it('reaches exactly the master at 2x for the largest usage', async () => {
    const img = await mountPortrait({
      heroId: 'prism',
      usage: 'panel',
      alt: 'Prism'
    });
    const srcset = img.attributes('srcset') ?? '';

    expect(srcset).toMatch(/w_256[^,]*prism\.webp 1x/);
    expect(srcset).toMatch(/w_512[^,]*prism\.webp 2x/);
  });

  it('passes class and listeners through to the box around the image', async () => {
    let clicks = 0;
    mounted = await mountSuspended(HeroPortrait, {
      props: { heroId: 'coupe', usage: 'card', alt: 'Coupe' },
      attrs: { class: 'bg-accented', onClick: () => clicks++ }
    });
    const box = mounted.find('span');

    expect(box.classes()).toContain('bg-accented');
    expect(mounted.find('img').classes()).not.toContain('bg-accented');
    await box.trigger('click');
    expect(clicks).toBe(1);
  });
});

// * Feature 028: a portrait still on its way is invisible over its box, alt text included, and fades in on load; one already held shows at once; a failed one shows its alt text.
describe('HeroPortrait loading', () => {
  // ! happy-dom fetches an image's `src` and settles `complete` on its own, so each test pins the state it is about; still-loading is the default here.
  beforeEach(() => {
    vi.spyOn(HTMLImageElement.prototype, 'complete', 'get').mockReturnValue(
      false
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('hides a portrait that is still loading', async () => {
    const img = await mountPortrait({
      heroId: 'coupe',
      usage: 'synergy',
      alt: 'Coupe'
    });

    expect(img.classes()).toContain('opacity-0');
  });

  it('fades the portrait in once it loads', async () => {
    const img = await mountPortrait({
      heroId: 'coupe',
      usage: 'synergy',
      alt: 'Coupe'
    });

    await img.trigger('load');

    expect(img.classes()).not.toContain('opacity-0');
    expect(img.classes()).toContain('portrait-fade-in');
  });

  it('shows the alt text when the portrait fails', async () => {
    const img = await mountPortrait({
      heroId: 'coupe',
      usage: 'synergy',
      alt: 'Coupe'
    });

    await img.trigger('error');

    expect(img.classes()).not.toContain('opacity-0');
    expect(img.classes()).not.toContain('portrait-fade-in');
  });

  it('shows a portrait the browser already holds at once, with no fade-in', async () => {
    vi.spyOn(HTMLImageElement.prototype, 'complete', 'get').mockReturnValue(
      true
    );
    vi.spyOn(HTMLImageElement.prototype, 'naturalWidth', 'get').mockReturnValue(
      216
    );

    const img = await mountPortrait({
      heroId: 'coupe',
      usage: 'card',
      alt: 'Coupe'
    });

    await img.trigger('load');

    expect(img.classes()).not.toContain('opacity-0');
    expect(img.classes()).not.toContain('portrait-fade-in');
  });
});
