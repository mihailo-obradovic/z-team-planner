import { afterEach, describe, expect, it } from 'vitest';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import { defineComponent, h, nextTick } from 'vue';

import HeroCard from '@/components/hero/HeroCard.vue';

import type { HeroId } from '@/types/hero';

// * Decision 017: a one-point change on one card re-renders that card alone. Before the special-power bonus was derived per hero, one computed over every hero's allocations handed each card a fresh object on any change, and every card on the overview re-rendered (the baseline's 250 ms level-up click).

const STUBS = {
  UTooltip: { template: '<div><slot /></div>' }
};

let mounted: Awaited<ReturnType<typeof mountSuspended>> | undefined;

afterEach(() => {
  mounted?.unmount();
  mounted = undefined;
});

async function mountCards(ids: HeroId[]) {
  const updates = new Map<HeroId, number>();
  let planner!: ReturnType<typeof useHeroPlanner>;

  mounted = await mountSuspended(
    defineComponent({
      setup() {
        planner = useHeroPlanner();

        return () =>
          h(
            'div',
            ids.map((heroId) => h(HeroCard, { heroId, key: heroId }))
          );
      }
    }),
    {
      global: {
        stubs: STUBS,
        mixins: [
          {
            updated(this: { $options: { __name?: string }; heroId?: HeroId }) {
              if (this.$options.__name === 'HeroCard' && this.heroId) {
                updates.set(this.heroId, (updates.get(this.heroId) ?? 0) + 1);
              }
            }
          }
        ]
      }
    }
  );
  await nextTick();

  return { planner, updates };
}

describe('HeroCard render scope', () => {
  it('a level-up on one hero re-renders only that card', async () => {
    const ids: HeroId[] = ['golem', 'prism', 'punch-up', 'malevola'];
    const { planner, updates } = await mountCards(ids);

    ids.forEach((id) => planner.resetHero(id));
    await nextTick();
    updates.clear();

    planner.statUp('golem', 'combat');
    await nextTick();

    expect(updates.get('golem')).toBe(1);
    expect(
      ids.filter((id) => id !== 'golem').map((id) => updates.get(id) ?? 0)
    ).toEqual([0, 0, 0]);

    planner.resetHero('golem');
  });
});
