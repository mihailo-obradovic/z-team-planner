import { afterEach, describe, expect, it } from 'vitest';
import { mountSuspended } from '@nuxt/test-utils/runtime';

import HeroCard from '@/components/hero/HeroCard.vue';

import type { HeroId } from '@/types/hero';

// * The share page's form of the card (feature 007): everything a viewer can read is still there for assistive technology, and nothing is a control.

const STUBS = {
  UTooltip: { template: '<div><slot /></div>' }
};

let mounted: Awaited<ReturnType<typeof mountSuspended>>[] = [];

afterEach(() => {
  mounted.forEach((component) => component.unmount());
  mounted = [];
});

async function card(readonly: boolean) {
  const wrapper = await mountSuspended(HeroCard, {
    props: { heroId: 'golem' as HeroId, readonly },
    global: { stubs: STUBS }
  });

  mounted.push(wrapper);

  return wrapper;
}

describe('the read-only hero card', () => {
  it('renders no control at all', async () => {
    const wrapper = await card(true);

    expect(wrapper.findAll('button')).toHaveLength(0);
    expect(wrapper.findAll('[aria-pressed]')).toHaveLength(0);
    expect(wrapper.findAll('[disabled]')).toHaveLength(0);
  });

  it('keeps the name, the level, the portrait and every stat value', async () => {
    const wrapper = await card(true);
    const text = wrapper.text();

    expect(wrapper.get('h3').text()).toBe('Golem');
    expect(text).toContain('Lv.');
    expect(wrapper.get('img').attributes('alt')).toBe('Golem');

    for (const stat of [
      'combat',
      'intellect',
      'vigor',
      'charisma',
      'mobility'
    ]) {
      expect(text.toLowerCase()).toContain(stat);
    }
  });

  it('shows each power as a labelled image naming its state', async () => {
    const wrapper = await card(true);
    const glyphs = wrapper.findAll('[role="img"][aria-label]');

    expect(glyphs.length).toBeGreaterThanOrEqual(3);

    for (const glyph of glyphs) {
      expect(glyph.attributes('aria-label')).toMatch(
        /, (revealed|hidden|trained|untrained)$|\(active\)|Form$|^Spread Thin|^Supernova|^En Pointe/
      );
      // * A span, never a button in disguise: no `type`, no tab stop.
      expect(glyph.element.tagName).toBe('SPAN');
      expect(glyph.attributes('type')).toBeUndefined();
      expect(glyph.attributes('tabindex')).toBeUndefined();
    }
  });

  it('is the ordinary card when the prop is off', async () => {
    const wrapper = await card(false);

    expect(wrapper.find('button[aria-label="View Golem"]').exists()).toBe(true);
    expect(wrapper.findAll('button[aria-pressed]').length).toBeGreaterThan(0);
  });
});
