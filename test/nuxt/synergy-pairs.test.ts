import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import { defineComponent, h } from 'vue';

import SynergyPairCard from '@/components/SynergyPairCard.vue';

import { DEFAULT_EP3_CUT, DEFAULT_EP4_HIRE, STAT_NAMES } from '@/types/hero';

// * Coverage for catalyst/features/014_synergy-pairs-tab.md: the derived card set, the shared pair values on a card, shared toggle state, and the portrait click.

const STUBS = {
  // * The chip row renders <u-tooltip>, which needs UApp's TooltipProvider; these tests are about the card, not tooltips.
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

// * A card left mounted reacts to the next test's planner reset mid-teardown; unmounting per test keeps those re-renders out of the following test.
let mounted: Awaited<ReturnType<typeof mountSuspended>> | null = null;

async function mountGolemPair() {
  const p = await planner();
  const column = p.synergyPairColumns.value.find(
    (c) => c.top.id === 'golem' || c.bottom.id === 'golem'
  )!;

  const card = await mountSuspended(SynergyPairCard, {
    props: { top: column.top, bottom: column.bottom },
    global: { stubs: STUBS }
  });
  mounted = card;

  return { p, card, column };
}

describe('synergy pairs', () => {
  afterEach(() => {
    mounted?.unmount();
    mounted = null;
  });

  beforeEach(async () => {
    const p = await planner();

    p.resetAllTrainings();
    p.monsterForm.value = false;
    p.ep3Cut.value = DEFAULT_EP3_CUT;
    p.ep4Hire.value = DEFAULT_EP4_HIRE;
  });

  it('derives four pairs by default and a fifth from the episode choices', async () => {
    const p = await planner();

    expect(p.synergyPairColumns.value).toHaveLength(4);

    p.ep3Cut.value = 'coupe';
    p.ep4Hire.value = 'phenomaman';

    // * Cutting Coupé also dissolves the Punch Up + Coupé base pair, so the conditional pair lands the count back on four.
    const pairs = p.synergyPairColumns.value;

    expect(
      pairs.some(
        (c) => c.top.id === 'phenomaman' || c.bottom.id === 'phenomaman'
      )
    ).toBe(true);
  });

  it("shows the planner's combined values for the pair", async () => {
    const { p, card, column } = await mountGolemPair();

    const totals = p.getPairCombinedStats(column.top.id, column.bottom.id);

    for (const stat of STAT_NAMES) {
      expect(card.text()).toContain(String(totals[stat]));
    }
  });

  it('updates when a power is toggled through the shared state', async () => {
    const { p, card, column } = await mountGolemPair();

    p.toggleStartingPower('golem');
    p.toggleTrainablePower('golem', 1);
    p.toggleSpecialPower('golem');
    await card.vm.$nextTick();

    const totals = p.getPairCombinedStats(column.top.id, column.bottom.id);

    expect(card.text()).toContain(String(totals.combat));
  });

  it("emits viewDetail with the clicked hero's id", async () => {
    const { card, column } = await mountGolemPair();

    await card.find('img').trigger('click');

    expect(card.emitted('viewDetail')).toEqual([[column.top.id]]);
  });
});
