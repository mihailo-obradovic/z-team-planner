import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import { defineComponent, h, nextTick } from 'vue';

import HeroCard from '@/components/HeroCard.vue';
import HeroDetailDialog from '@/components/HeroDetailDialog.vue';

import type { HeroId, StatName } from '@/types/hero';

// * Characterization, not specification: every assertion here was read off the two components as they behaved before their shared derived values moved into `useHeroDerived`, and they exist so that move can be shown to have changed nothing. What they really pin is agreement — the card and the dialog derive the same hero from the same state, which is the one thing two copies of a computed are always at risk of losing.

const STUBS = {
  // * Both components render <u-tooltip>, which needs UApp's TooltipProvider; these cases are about derived values, not tooltips.
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

// ! The dialog teleports to the body and a teleport outlives its component, so each mount is torn down and the body cleared — otherwise a later case reads an earlier case's markup.
let mounted: Awaited<ReturnType<typeof mountSuspended>>[] = [];

afterEach(() => {
  mounted.forEach((m) => m.unmount());
  mounted = [];
  document.body.innerHTML = '';
});

beforeEach(async () => {
  const p = await planner();

  // ! `resetAllTrainings` leaves stat allocations alone — it clears powers, flight and bonus levels only — so a spent level-up survives it and leaks into the next case. Every hero these cases touch is reset individually as well.
  p.resetAllTrainings();
  (['golem', 'phenomaman', 'blonde-blazer'] as HeroId[]).forEach((id) =>
    p.resetHero(id)
  );
  p.monsterForm.value = false;
});

async function cardText(heroId: HeroId) {
  const card = await mountSuspended(HeroCard, {
    props: { heroId },
    global: { stubs: STUBS }
  });

  mounted.push(card);
  await nextTick();

  return card.text().replace(/\s+/g, ' ');
}

async function dialogText(heroId: HeroId) {
  const dialog = await mountSuspended(HeroDetailDialog, {
    props: { heroId },
    global: { stubs: STUBS }
  });

  mounted.push(dialog);
  await nextTick();

  return document.body.textContent!.replace(/\s+/g, ' ');
}

describe('hero derived values', () => {
  it('reads an untouched hero as level 1 in both places', async () => {
    expect(await cardText('golem')).toContain('Lv. 1');
    expect(await dialogText('golem')).toContain('Level 1');
  });

  it('gives a fixed-level hero the level the game fixes, in both places', async () => {
    // * Phenomaman is 12 and Blonde Blazer 20 however much is spent; neither can be levelled at all.
    expect(await cardText('phenomaman')).toContain('Lv. 12');
    expect(await dialogText('phenomaman')).toContain('Level 12');

    expect(await cardText('blonde-blazer')).toContain('Lv. 20');
    expect(await dialogText('blonde-blazer')).toContain('Level 20');
  });

  it('counts spent level-ups into the level in both places', async () => {
    const p = await planner();

    p.statUp('golem', 'combat');
    p.statUp('golem', 'combat');

    expect(await cardText('golem')).toContain('Lv. 3');
    expect(await dialogText('golem')).toContain('Level 3');
  });

  it('does not count a bonus level as a level, in either place', async () => {
    const p = await planner();

    p.addBonusLevel('golem');

    // ! The bonus raises the per-hero cap; it is not itself a level. Counting it made the level jump before the extra point was spent, and made the card disagree with the dialog.
    expect(await cardText('golem')).toContain('Lv. 1');
    expect(await dialogText('golem')).toContain('Level 1');
  });

  it('shows the granted bonus in the dialog', async () => {
    const p = await planner();

    p.addBonusLevel('golem');
    p.addBonusLevel('golem');

    expect(await dialogText('golem')).toContain('Bonus 2');
  });

  it('spends against the bonus-raised cap', async () => {
    const p = await planner();

    p.addBonusLevel('golem');

    // ! Spread across stats on purpose: a single stat clamps at 10, which would stop the spending well before the level cap and measure the wrong ceiling.
    const stats: StatName[] = [
      'combat',
      'intellect',
      'vigor',
      'charisma',
      'mobility'
    ];

    for (let i = 0; i < 10; i++) {
      p.statUp('golem', stats[i % stats.length]!);
    }

    // * Nine level-ups plus one bonus level is ten spends, so the hero reads level 11.
    expect(await cardText('golem')).toContain('Lv. 11');
    expect(await dialogText('golem')).toContain('Level 11');
  });
});
