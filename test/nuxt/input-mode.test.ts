import { mountSuspended } from '@nuxt/test-utils/runtime';
import { defineComponent, h } from 'vue';
import { describe, expect, it } from 'vitest';

// * Coverage for catalyst/features/018_hints-and-confirmations.md: without `window.matchMedia` (jsdom, as in every prerendered route's first paint) the mode stays `hover`, the pre-feature behaviour.
describe('useInputMode', () => {
  it('defaults to hover when matchMedia is unavailable', async () => {
    let instance!: ReturnType<typeof useInputMode>;

    await mountSuspended(
      defineComponent({
        setup() {
          instance = useInputMode();

          return () => h('div');
        }
      })
    );

    expect(instance.value).toBe('hover');
  });
});
