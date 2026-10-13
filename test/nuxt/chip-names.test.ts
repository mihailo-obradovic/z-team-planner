import { afterEach, describe, expect, it } from 'vitest';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import { defineComponent, h, nextTick } from 'vue';

import HeroCard from '@/components/hero/HeroCard.vue';

import type { HeroId } from '@/types/hero';

// * Coverage for catalyst/features/018_hints-and-confirmations.md, the screen-reader table: a chip is named by its power, its state is the pressed state, and its hint is the description.

const STUBS = {
  UTooltip: { template: '<div><slot /></div>' }
};

let mounted: Awaited<ReturnType<typeof mountSuspended>>[] = [];

afterEach(() => {
  mounted.forEach((component) => component.unmount());
  mounted = [];
});

async function card(heroId: HeroId) {
  const wrapper = await mountSuspended(HeroCard, {
    props: { heroId },
    global: { stubs: STUBS },
    attachTo: document.body
  });

  mounted.push(wrapper);

  return wrapper;
}

function description(button: Element): string | undefined {
  const id = button.getAttribute('aria-describedby');

  return id ? document.getElementById(id)?.textContent?.trim() : undefined;
}

function chips(wrapper: Awaited<ReturnType<typeof card>>) {
  return wrapper
    .findAll('button[aria-pressed]')
    .map((chip) => chip.element)
    .filter(
      (chip) => !/^(Add|Remove) /.test(chip.getAttribute('aria-label') ?? '')
    );
}

describe('power chip names', () => {
  it('names each chip by its power and describes it with the hint', async () => {
    const wrapper = await card('golem');
    const golemChips = chips(wrapper);

    expect(golemChips.length).toBeGreaterThanOrEqual(3);

    // ! The defect this pins: the name was the whole hint, so a screen reader read every power's description at every Tab stop.
    for (const chip of golemChips) {
      const name = chip.getAttribute('aria-label')!;

      expect(name).not.toContain(':');
      expect(description(chip)).toMatch(new RegExp(`^${name}: .+`));
    }
  });

  it('keeps Sonar’s form chip named while the pressed state flips', async () => {
    const { monsterForm } = await planner();

    monsterForm.value = false;

    const wrapper = await card('sonar');
    function form() {
      return wrapper.get('button[aria-label="Mega Bat Form"]');
    }

    expect(form().attributes('aria-pressed')).toBe('false');
    expect(description(form().element)).toBe('Hybrid Form');

    monsterForm.value = true;
    await nextTick();

    expect(form().attributes('aria-pressed')).toBe('true');
    // * The hint now says the name again, so it is left out rather than read twice.
    expect(form().attributes('aria-describedby')).toBeUndefined();

    monsterForm.value = false;
  });

  it('calls an unnamed flight power "Flight"', async () => {
    const wrapper = await card('blonde-blazer');
    const flight = wrapper.get('button[aria-label="Flight"]');

    expect(description(flight.element)).toBeTruthy();
  });
});

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
