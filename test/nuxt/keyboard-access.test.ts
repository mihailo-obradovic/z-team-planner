import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import { defineComponent, h } from 'vue';

import HeroCard from '@/components/hero/HeroCard.vue';
import HeroPowersPanel from '@/components/hero/HeroPowersPanel.vue';

import type { HeroId } from '@/types/hero';

// * Every control that opens a hero or toggles a power is a native button, so a keyboard reaches it and Enter and Space both press it.

const STUBS = {
  // * The chip row renders <u-tooltip>, which needs UApp's TooltipProvider; these cases are about the card, not tooltips.
  UTooltip: { template: '<div><slot /></div>' }
};

async function planner() {
  let instance!: ReturnType<typeof useHeroPlanner>;

  await mountSuspended(
    defineComponent({
      setup() {
        instance = useHeroPlanner();

        return () => h('div');
      }
    })
  );

  return instance;
}

let mounted: Awaited<ReturnType<typeof mountSuspended>>[] = [];

beforeEach(async () => {
  const p = await planner();

  p.resetAllTrainings();
});

afterEach(() => {
  mounted.forEach((component) => component.unmount());
  mounted = [];
});

function track<T extends Awaited<ReturnType<typeof mountSuspended>>>(
  wrapper: T
): T {
  mounted.push(wrapper);

  return wrapper;
}

describe('keyboard access', () => {
  it("opens a hero's detail from a button around the card portrait", async () => {
    const card = track(
      await mountSuspended(HeroCard, {
        props: { heroId: 'golem' as HeroId },
        global: { stubs: STUBS }
      })
    );
    const portrait = card.get('button[aria-label="View Golem"]');

    expect(portrait.find('img').exists()).toBe(true);

    await portrait.trigger('click');

    expect(card.emitted('viewDetail')).toHaveLength(1);
  });

  it('renders each power as a toggle button, disabled while it is locked', async () => {
    const panel = track(
      await mountSuspended(HeroPowersPanel, {
        props: { heroId: 'golem' as HeroId },
        global: { stubs: STUBS }
      })
    );
    const toggles = panel.findAll('button[aria-pressed]');

    expect(toggles.length).toBeGreaterThanOrEqual(3);

    const [starting, firstUpgrade] = toggles;

    expect(starting!.attributes('aria-pressed')).toBe('false');
    expect(starting!.attributes('disabled')).toBeUndefined();
    expect(firstUpgrade!.attributes('disabled')).toBeDefined();

    await starting!.trigger('click');

    expect(starting!.attributes('aria-pressed')).toBe('true');
    expect(firstUpgrade!.attributes('disabled')).toBeUndefined();
  });
});
