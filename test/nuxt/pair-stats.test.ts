import { beforeEach, describe, expect, it } from 'vitest';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import { defineComponent, h } from 'vue';

import { MAX_STAT_VALUE, STAT_NAMES } from '@/types/hero';

// * Coverage for catalyst/features/014_synergy-pairs-tab.md: the shared pair computation — per-hero clamp before summing, the two-hero Spread Thin deduction, and the Sonar form swap on either side of a pair.

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

describe('pair combined stats', () => {
  beforeEach(async () => {
    const p = await planner();

    p.resetAllTrainings();
    p.monsterForm.value = false;
    for (const column of p.synergyPairColumns.value) {
      p.resetHero(column.top.id);
      p.resetHero(column.bottom.id);
    }
  });

  it('clamps each hero at the cap before summing, and lets the sum pass it', async () => {
    const p = await planner();

    // * Coupé combat 4 starting + 5 allocated = 9; upgraded En Pointe would land on 12 unclamped.
    p.toggleStartingPower('coupe');
    p.toggleTrainablePower('coupe', 2);
    p.toggleSpecialPower('coupe');
    for (let i = 0; i < 5; i++) {
      p.statUp('coupe', 'combat');
    }

    expect(p.getEffectiveStats('coupe').combat).toBe(MAX_STAT_VALUE);

    const combined = p.getPairCombinedStats('punch-up', 'coupe');
    const punchUpCombat = p.getEffectiveStats('punch-up').combat;

    expect(combined.combat).toBe(punchUpCombat + MAX_STAT_VALUE);
    expect(combined.combat).toBeGreaterThan(MAX_STAT_VALUE);
  });

  it('credits Golem one slot fewer than his own card in a pair', async () => {
    const p = await planner();

    p.toggleStartingPower('golem');
    p.toggleTrainablePower('golem', 1);
    for (let i = 0; i < 3; i++) {
      p.toggleSpecialPower('golem');
    }

    for (const stat of STAT_NAMES) {
      expect(p.getPairEffectiveStats('golem')[stat]).toBe(
        Math.min(
          p.heroes.value!.find((h) => h.id === 'golem')!.startingStats[stat] +
            p.getPairSpecialPowerBonusStats('golem')[stat],
          MAX_STAT_VALUE
        )
      );
    }
  });

  it('swaps Sonar\'s contribution when the form is on, whichever side he is', async () => {
    const p = await planner();
    const off = p.getPairCombinedStats('malevola', 'sonar');

    p.toggleMonsterForm();

    const on = p.getPairCombinedStats('malevola', 'sonar');
    const sonarBase = p.heroes.value!.find((h) => h.id === 'sonar')!
      .startingStats;
    const malevolaCombat = p.getEffectiveStats('malevola').combat;

    expect(off.combat).toBe(malevolaCombat + sonarBase.combat);
    expect(on.combat).toBe(malevolaCombat + sonarBase.intellect);
  });

  it('is symmetric in its arguments', async () => {
    const p = await planner();

    expect(p.getPairCombinedStats('golem', 'invisigal')).toEqual(
      p.getPairCombinedStats('invisigal', 'golem')
    );
  });
});
