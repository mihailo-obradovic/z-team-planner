import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime';
import { UApp } from '#components';
import { defineComponent, h, nextTick } from 'vue';
import { afterEach, describe, expect, it, vi } from 'vitest';

import TooltipButton from '@/components/_shared/TooltipButton.vue';

import type { InputMode } from '@/composables/ui/useInputMode';

// * Coverage for catalyst/features/018_hints-and-confirmations.md: the input mode flipping to `no-hover` and back leaves the tooltip's `open` model holding a boolean, never `undefined`. Reka decides at setup whether `open` is passive, and a passive model copies the prop verbatim, so a controlled `false` followed by the uncontrolled `undefined` used to leave `Presence` warning on every render.

const mode = ref<InputMode>('hover');

mockNuxtImport('useInputMode', () => () => readonly(mode));

let mounted: Awaited<ReturnType<typeof mountSuspended>> | null = null;

afterEach(() => {
  mounted?.unmount();
  mounted = null;
  mode.value = 'hover';
  document.body.innerHTML = '';
  vi.restoreAllMocks();
});

describe('TooltipButton across a device capability flip', () => {
  it('raises no prop warning when the mode returns to hover', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    mounted = await mountSuspended(
      defineComponent({
        setup() {
          return () =>
            h(
              UApp,
              {},
              {
                default: () =>
                  h(TooltipButton, { text: 'Comet', icon: 'i-lucide-swords' })
              }
            );
        }
      })
    );

    mode.value = 'no-hover';
    await nextTick();
    mode.value = 'hover';
    await nextTick();
    await nextTick();

    const presentWarnings = warn.mock.calls.filter((call) =>
      String(call[0]).includes('prop "present"')
    );

    expect(presentWarnings).toHaveLength(0);
  });
});
