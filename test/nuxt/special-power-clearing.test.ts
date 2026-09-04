import { mountSuspended } from '@nuxt/test-utils/runtime';
import { defineComponent, h } from 'vue';
import { describe, expect, it } from 'vitest';

// * Coverage for catalyst/features/012_special-powers.md, Clearing: every change to the trainable
// * selection drops the hero's special state. Switching straight from one trainable to the other was
// * the path that did not, and `getSpecialPowerBonus` never re-checks the gate, so the effect went on
// * paying out with no chip left on screen to turn it off.

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

describe('special power clearing', () => {
  it('drops Supernova when its trainable is replaced', async () => {
    const p = await planner();

    p.resetAllTrainings();
    p.resetHero('flambae');
    p.toggleStartingPower('flambae');
    p.toggleTrainablePower('flambae', 2);
    p.toggleSpecialPower('flambae');

    expect(p.getSpecialPowerState('flambae')).toBe(1);
    expect(p.getSpecialPowerBonusStats('flambae').combat).toBeGreaterThan(0);

    p.toggleTrainablePower('flambae', 1);

    expect(p.getSpecialPowerState('flambae')).toBe(0);
    expect(p.getSpecialPowerBonusStats('flambae').combat).toBe(0);
    expect(p.getSpecialPowerBonusStats('flambae').mobility).toBe(0);
  });

  it('drops Spread Thin when its trainable is replaced', async () => {
    const p = await planner();

    p.resetAllTrainings();
    p.resetHero('golem');
    p.toggleStartingPower('golem');
    p.toggleTrainablePower('golem', 1);
    p.toggleSpecialPower('golem');

    expect(p.getSpecialPowerState('golem')).toBe(1);

    p.toggleTrainablePower('golem', 2);

    expect(p.getSpecialPowerState('golem')).toBe(0);
    expect(p.getSpecialPowerBonusStats('golem').combat).toBe(0);
  });

  // * The distinction the fix turns on: Coupé's En Pointe hangs off her starting power, so a trainable
  // * only changes how big its bonus is. Clearing on every selection change would have broken it.
  it('keeps ungated En Pointe when a trainable is trained', async () => {
    const p = await planner();

    p.resetAllTrainings();
    p.resetHero('coupe');
    p.toggleStartingPower('coupe');
    p.toggleSpecialPower('coupe');

    expect(p.getSpecialPowerState('coupe')).toBe(1);
    expect(p.getSpecialPowerBonusStats('coupe').combat).toBe(1);

    p.toggleTrainablePower('coupe', 2);

    expect(p.getSpecialPowerState('coupe')).toBe(1);
    expect(p.getSpecialPowerBonusStats('coupe').combat).toBe(3);
  });

  it('still clears on deselecting the same trainable', async () => {
    const p = await planner();

    p.resetAllTrainings();
    p.resetHero('flambae');
    p.toggleStartingPower('flambae');
    p.toggleTrainablePower('flambae', 2);
    p.toggleSpecialPower('flambae');
    p.toggleTrainablePower('flambae', 2);

    expect(p.getSpecialPowerState('flambae')).toBe(0);
  });
});
