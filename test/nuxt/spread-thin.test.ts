import { describe, expect, it } from 'vitest';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import { defineComponent, h } from 'vue';

import { MAX_STAT_VALUE } from '@/types/hero';

// * Coverage for catalyst/features/012_special-powers.md: Golem's Spread Thin — the floor-once formula, the stat cap, the trainable-1 gate, and the pair total's slot deduction.

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

async function trainedGolem() {
  const p = await planner();

  p.resetAllTrainings();
  p.resetHero('golem');
  p.toggleStartingPower('golem');
  p.toggleTrainablePower('golem', 1);

  return p;
}

function spread(p: Awaited<ReturnType<typeof trainedGolem>>, slots: number) {
  for (let i = 0; i < slots; i++) {
    p.toggleSpecialPower('golem');
  }
}

describe('Spread Thin', () => {
  it('is inert until Spread Thin itself is trained', async () => {
    const p = await planner();

    p.resetHero('golem');
    p.toggleSpecialPower('golem');

    expect(p.getSpecialPowerState('golem')).toBe(0);

    p.toggleStartingPower('golem');
    p.toggleTrainablePower('golem', 2); // * Found Himself, not Spread Thin
    p.toggleSpecialPower('golem');

    expect(p.getSpecialPowerState('golem')).toBe(0);
  });

  it('cycles off → 1 → 2 → 3 slots and back to off', async () => {
    const p = await trainedGolem();

    for (const expected of [1, 2, 3, 0]) {
      p.toggleSpecialPower('golem');
      expect(p.getSpecialPowerState('golem')).toBe(expected);
    }
  });

  it('floors the percentage once against the whole stat', async () => {
    const p = await trainedGolem();

    // * Combat 3 starting + 3 allocated = 6, the value where a floored tier and a repeated per-slot increment disagree.
    for (let i = 0; i < 3; i++) {
      p.statUp('golem', 'combat');
    }

    spread(p, 1);
    expect(p.getSpecialPowerBonusStats('golem').combat).toBe(1);

    spread(p, 1);
    expect(p.getSpecialPowerBonusStats('golem').combat).toBe(3);

    spread(p, 1);
    expect(p.getSpecialPowerBonusStats('golem').combat).toBe(4);
  });

  it('leaves a stat too small to yield a whole point untouched', async () => {
    const p = await trainedGolem();

    spread(p, 3);

    // * Intellect 1: floor(1 × 0.75) is 0 at every slot count.
    expect(p.getSpecialPowerBonusStats('golem').intellect).toBe(0);
  });

  it('never carries a stat past the cap', async () => {
    const p = await trainedGolem();

    // * Vigor 4 starting + 5 allocated = 9; three slots would otherwise add 6.
    for (let i = 0; i < 5; i++) {
      p.statUp('golem', 'vigor');
    }

    spread(p, 3);

    const vigor = 9 + p.getSpecialPowerBonusStats('golem').vigor;

    expect(vigor).toBe(MAX_STAT_VALUE);
  });

  it('counts one slot fewer in a pair total, because the partner fills it', async () => {
    const p = await trainedGolem();

    for (let i = 0; i < 3; i++) {
      p.statUp('golem', 'combat');
    }

    spread(p, 3);

    expect(p.getSpecialPowerBonusStats('golem').combat).toBe(4);
    expect(p.getPairSpecialPowerBonusStats('golem').combat).toBe(3);
  });

  it('leaves heroes without a slot power untouched by the pair rule', async () => {
    const p = await planner();

    p.resetHero('coupe');
    p.toggleStartingPower('coupe');
    p.toggleSpecialPower('coupe');

    expect(p.getPairSpecialPowerBonusStats('coupe')).toEqual(
      p.getSpecialPowerBonusStats('coupe')
    );
  });
});
