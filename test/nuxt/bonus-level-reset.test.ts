import { describe, expect, it } from 'vitest';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import { defineComponent, h } from 'vue';

import { MAX_LEVEL_UPS } from '@/types/hero';

// * Regression coverage for catalyst/features/003_planner-mechanics.md: clearing bonus levels must not leave allocations above the level-up budget ("allocations never exceed budgets even transiently"), which the API rejects on save.

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

describe('clearing bonus levels', () => {
  it('leaves no hero above the level-up budget after Reset all trainings', async () => {
    const p = await planner();

    p.addBonusLevel('coupe');

    for (let i = 0; i < MAX_LEVEL_UPS + 1; i++) {
      p.statUp('coupe', i % 2 === 0 ? 'vigor' : 'charisma');
    }

    expect(p.getLevelUpPointsUsed('coupe')).toBe(MAX_LEVEL_UPS + 1);

    p.resetAllTrainings();

    expect(p.getBonusLevel('coupe')).toBe(0);
    expect(p.getLevelUpPointsUsed('coupe')).toBeLessThanOrEqual(MAX_LEVEL_UPS);
  });
});
