import { mountSuspended } from '@nuxt/test-utils/runtime';
import { afterEach, describe, expect, it } from 'vitest';

import HeroPortrait from '@/components/HeroPortrait.vue';

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

  it('passes class and listeners through to the image', async () => {
    let clicks = 0;
    mounted = await mountSuspended(HeroPortrait, {
      props: { heroId: 'coupe', usage: 'card', alt: 'Coupe' },
      attrs: { class: 'object-top', onClick: () => clicks++ }
    });
    const img = mounted.find('img');

    expect(img.classes()).toContain('object-top');
    await img.trigger('click');
    expect(clicks).toBe(1);
  });
});
