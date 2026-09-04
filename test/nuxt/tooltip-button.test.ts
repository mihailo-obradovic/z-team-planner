import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime';
import { UApp } from '#components';
import { defineComponent, h, nextTick } from 'vue';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import TooltipButton from '@/components/_shared/TooltipButton.vue';

// * Coverage for catalyst/features/018_hints-and-confirmations.md: a chip's confirmation only in `no-hover` mode, never in `hover` mode, never when there is nothing to confirm, and a second tap replaces rather than stacking.

let mode: 'hover' | 'no-hover' = 'hover';

mockNuxtImport('useInputMode', () => () => ref(mode));

let mounted: Awaited<ReturnType<typeof mountSuspended>> | null = null;

afterEach(() => {
  mounted?.unmount();
  mounted = null;
  document.body.innerHTML = '';
});

beforeEach(() => {
  mode = 'hover';
});

type ChipProps = InstanceType<typeof TooltipButton>['$props'] & {
  confirmation?: () => string | null;
};

// * `u-tooltip` needs `UApp`'s `TooltipProvider` (see the note on the other tests that stub it away instead); this file is the one that actually needs the tooltip to render.
function chip(props: ChipProps) {
  return defineComponent({
    setup() {
      return () => h(UApp, {}, { default: () => h(TooltipButton, props) });
    }
  });
}

async function tap(props: ChipProps) {
  mounted = await mountSuspended(chip(props));

  await mounted.get('button').trigger('click');
  await nextTick();
  await nextTick();

  return mounted;
}

describe('TooltipButton confirmations', () => {
  it('shows the confirmation on a no-hover tap', async () => {
    mode = 'no-hover';

    await tap({
      text: 'Comet: a description',
      icon: 'i-lucide-swords',
      confirmation: () => 'Comet trained'
    });

    expect(document.body.textContent).toContain('Comet trained');
  });

  it('shows nothing in hover mode, even with a confirmation available', async () => {
    mode = 'hover';

    await tap({
      text: 'Comet: a description',
      icon: 'i-lucide-swords',
      confirmation: () => 'Comet trained'
    });

    expect(document.body.textContent).not.toContain('Comet trained');
  });

  it('shows nothing when the confirmation reports no change', async () => {
    mode = 'no-hover';

    await tap({
      text: 'Comet: a description',
      icon: 'i-lucide-swords',
      confirmation: () => null
    });

    expect(document.body.textContent).not.toContain('Comet trained');
  });

  it('shows nothing for a chip with no confirmation at all', async () => {
    mode = 'no-hover';

    await tap({ text: 'Reset budget', icon: 'i-lucide-rotate-ccw' });

    expect(document.body.querySelector('[role="tooltip"]')).toBeNull();
  });

  it('replaces rather than stacking when a second chip is tapped', async () => {
    mode = 'no-hover';

    const both = defineComponent({
      setup() {
        return () =>
          h(
            UApp,
            {},
            {
              default: () => [
                h(TooltipButton, {
                  text: 'On Fire',
                  icon: 'i-lucide-zap',
                  confirmation: () => 'On Fire revealed'
                }),
                h(TooltipButton, {
                  text: 'Comet',
                  icon: 'i-lucide-swords',
                  confirmation: () => 'Comet trained'
                })
              ]
            }
          );
      }
    });

    mounted = await mountSuspended(both);

    const buttons = mounted.findAll('button');

    await buttons[0]!.trigger('click');
    await nextTick();
    await nextTick();
    expect(document.body.textContent).toContain('On Fire revealed');

    await buttons[1]!.trigger('click');
    await nextTick();
    await nextTick();

    expect(document.body.textContent).not.toContain('On Fire revealed');
    expect(document.body.textContent).toContain('Comet trained');
  });
});
