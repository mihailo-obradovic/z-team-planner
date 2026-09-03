import { afterEach, describe, expect, it } from 'vitest';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import { defineComponent, h, nextTick } from 'vue';

import HeroDetailDialog from '@/components/HeroDetailDialog.vue';

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

let open: Awaited<ReturnType<typeof mountSuspended>> | null = null;

afterEach(() => {
  open?.unmount();
  open = null;
  document.body.innerHTML = '';
});

describe('switching heroes', () => {
  it('keeps allocations visible after switching', async () => {
    const p = await planner();
    p.statUp('golem', 'combat');
    p.statUp('golem', 'combat');
    await nextTick();

    open = await mountSuspended(HeroDetailDialog, {
      props: { heroId: 'golem' }
    });
    await nextTick();

    const golem = p.heroes.value.find((h) => h.id === 'golem')!;
    console.log(
      'ALLOC before switch',
      JSON.stringify(p.getStatAllocations('golem'))
    );
    console.log(
      'EFFECTIVE before',
      JSON.stringify(p.getEffectiveStats('golem'))
    );

    const partnerId = p.synergyPairColumns.value
      .map((c) =>
        c.top.id === 'golem'
          ? c.bottom.id
          : c.bottom.id === 'golem'
            ? c.top.id
            : null
      )
      .find(Boolean)!;

    await open.setProps({ heroId: partnerId });
    await nextTick();
    await open.setProps({ heroId: 'golem' });
    await nextTick();

    const statList = [...document.querySelectorAll('li')].map((li) =>
      li.textContent?.replace(/\s+/g, ' ').trim()
    );
    console.log('DOM STATS after switch', JSON.stringify(statList));
    console.log(
      'DOM head',
      document.body.textContent?.replace(/\s+/g, ' ').slice(0, 300)
    );
    console.log(
      'ALLOC after switch',
      JSON.stringify(p.getStatAllocations('golem'))
    );
    console.log(
      'EFFECTIVE after',
      JSON.stringify(p.getEffectiveStats('golem'))
    );
    console.log('startingStats', JSON.stringify(golem.startingStats));

    expect(p.getStatAllocations('golem').combat).toBe(2);
  });
});
