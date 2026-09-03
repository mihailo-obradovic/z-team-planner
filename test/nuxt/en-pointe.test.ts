import { describe, expect, it } from 'vitest';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import { defineComponent, h } from 'vue';

import { MAX_STAT_VALUE } from '@/types/hero';

// * Coverage for catalyst/features/012_special-powers.md: Coupé's En Pointe — the base and upgraded bonus, and the clamp that keeps an effective stat from passing 10.

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

async function revealedCoupe() {
  const p = await planner();

  p.resetAllTrainings();
  p.resetHero('coupe');
  p.toggleStartingPower('coupe');

  return p;
}

describe('En Pointe', () => {
  it('adds the base bonus untrained and the upgraded bonus with À la Seconde', async () => {
    const p = await revealedCoupe();

    p.toggleSpecialPower('coupe'); // * state 1: combat

    expect(p.getSpecialPowerBonusStats('coupe').combat).toBe(1);

    p.toggleTrainablePower('coupe', 2); // * À la Seconde

    expect(p.getSpecialPowerBonusStats('coupe').combat).toBe(3);
  });

  it('shrinks the bonus so the effective stat stops at the cap', async () => {
    const p = await revealedCoupe();

    p.toggleTrainablePower('coupe', 2);
    p.toggleSpecialPower('coupe');

    // * Combat 4 starting + 5 allocated = 9; the upgraded +3 would otherwise land on 12.
    for (let i = 0; i < 5; i++) {
      p.statUp('coupe', 'combat');
    }

    expect(p.getSpecialPowerBonusStats('coupe').combat).toBe(1);
    expect(9 + p.getSpecialPowerBonusStats('coupe').combat).toBe(
      MAX_STAT_VALUE
    );
  });

  it('contributes nothing on a stat already at the cap', async () => {
    const p = await revealedCoupe();

    p.toggleTrainablePower('coupe', 2);
    p.toggleSpecialPower('coupe');

    for (let i = 0; i < 6; i++) {
      p.statUp('coupe', 'combat');
    }

    expect(p.getSpecialPowerBonusStats('coupe').combat).toBe(0);
  });
});
