import { beforeEach, describe, expect, it } from 'vitest';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import { defineComponent, h } from 'vue';

import HeroCard from '@/components/HeroCard.vue';

// * Coverage for catalyst/features/012_special-powers.md: Sonar's form is one shared display state across every surface, never serialized (lifted for feature 014).

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

describe('monster form', () => {
  beforeEach(async () => {
    const p = await planner();

    p.monsterForm.value = false;
  });

  it("swaps Sonar's display stats only while the form is on", async () => {
    const p = await planner();

    expect(p.resolveDisplayStat('sonar', 'combat')).toBe('combat');

    p.toggleMonsterForm();

    expect(p.resolveDisplayStat('sonar', 'combat')).toBe('intellect');
    expect(p.resolveDisplayStat('sonar', 'vigor')).toBe('charisma');
    expect(p.resolveDisplayStat('sonar', 'mobility')).toBe('mobility');
  });

  it('never swaps another hero, form on or off', async () => {
    const p = await planner();

    p.toggleMonsterForm();

    expect(p.resolveDisplayStat('golem', 'combat')).toBe('combat');
  });

  it('reaches a mounted card through the shared state', async () => {
    const p = await planner();
    const card = await mountSuspended(HeroCard, {
      props: { heroId: 'sonar' as const },
      global: {
        stubs: {
          // * The card renders <u-tooltip>, which needs UApp's TooltipProvider; this test is about the shared form state, not tooltips.
          UTooltip: { template: '<div><slot /></div>' }
        }
      }
    });

    expect(card.find('img').attributes('src')).toContain('sonar-hybrid');

    p.toggleMonsterForm();
    await card.vm.$nextTick();

    expect(card.find('img').attributes('src')).toContain('sonar-monster');
  });
});
