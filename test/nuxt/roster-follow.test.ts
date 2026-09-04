import { mountSuspended } from '@nuxt/test-utils/runtime';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { defineComponent, h, nextTick } from 'vue';

import HeroDetailDialog from '@/components/HeroDetailDialog.vue';

import type { HeroId } from '@/types/hero';

// * Coverage for catalyst/features/019_roster-follow.md. The rule under test is when the dialog asks a
// * roster strip to bring the marked tile into view, and with which target — never how far it scrolls,
// * which is feature 013's arithmetic and is unit-tested against scrollOffsetIntoView directly.

const asked: HTMLElement[] = [];

// * A stub in place of ScrollRegion: jsdom lays nothing out, so the real bringIntoView measures zeroes and
// * returns without scrolling. Recording the call is what proves the dialog asked, with the right tile.
const ScrollRegionStub = defineComponent({
  name: 'ScrollRegion',
  props: {
    as: { type: String, default: 'div' },
    axis: { type: String, default: 'vertical' }
  },
  setup(props, { slots, expose }) {
    expose({
      bringIntoView: (target: HTMLElement) => {
        asked.push(target);
      }
    });

    return () => h(props.as, {}, slots.default?.());
  }
});

// ! The dialog teleports to the body, and a teleport is not removed by unmounting alone — without clearing
// ! it between cases every query also finds the previous test's dialog.
let open: Awaited<ReturnType<typeof mountSuspended>> | null = null;

async function openDialog(heroId: HeroId) {
  open = await mountSuspended(HeroDetailDialog, {
    props: { heroId },
    global: { stubs: { ScrollRegion: ScrollRegionStub } }
  });

  // * The follow is deferred one frame past the DOM patch, so a case has to let that frame run.
  await frame();

  return open;
}

function frame() {
  return new Promise((resolve) => requestAnimationFrame(resolve));
}

function markedTiles() {
  return [...document.querySelectorAll<HTMLElement>('[aria-current="true"]')];
}

beforeEach(() => {
  asked.length = 0;
});

afterEach(() => {
  open?.unmount();
  open = null;
  document.body.innerHTML = '';
});

describe('roster follow', () => {
  it('asks both strips to bring the marked tile into view when the dialog opens', async () => {
    await openDialog('golem');

    const marked = markedTiles();

    expect(marked).toHaveLength(2);
    expect(asked).toHaveLength(2);
    expect(asked).toEqual(expect.arrayContaining(marked));
  });

  it('asks with the tile of the hero now open, not the one it replaced', async () => {
    const page = await openDialog('golem');
    const first = markedTiles();

    asked.length = 0;
    await page.setProps({ heroId: 'flambae' });
    await frame();

    const second = markedTiles();

    expect(asked).toHaveLength(2);
    expect(asked).toEqual(expect.arrayContaining(second));
    for (const tile of first) {
      expect(asked).not.toContain(tile);
    }
  });

  it('follows the synergy partner the dialog moves to', async () => {
    // ! The dialog teleports, so its controls are reachable through the document rather than the wrapper.
    const page = await openDialog('flambae');
    const partner = [...document.querySelectorAll('button')].find((button) =>
      button.textContent?.includes('Synergy partner')
    );

    expect(partner).toBeDefined();

    asked.length = 0;
    partner!.click();
    await nextTick();

    const requested = page.emitted('select')?.at(-1)?.[0] as HeroId;

    expect(requested).not.toBe('flambae');

    await page.setProps({ heroId: requested });
    await frame();

    expect(asked).toEqual(expect.arrayContaining(markedTiles()));
  });

  it('follows the tile the user clicked, even when it is already the open hero', async () => {
    await openDialog('golem');

    asked.length = 0;
    const marked = markedTiles()[0]!;
    marked.click();

    expect(asked).toContain(marked);
  });

  it('asks for nothing when the open hero is not on the roster', async () => {
    const page = await openDialog('golem');

    asked.length = 0;
    await page.setProps({ heroId: null });
    await frame();

    expect(asked).toEqual([]);
  });
});
