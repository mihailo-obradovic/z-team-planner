import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime';
import { defineComponent, h } from 'vue';
import { beforeEach, describe, expect, it } from 'vitest';

import AuthMenu from '@/components/_shared/AuthMenu.vue';
import { useAuthStore } from '@/stores/useAuthStore';

const toasts: { title?: string }[] = [];
mockNuxtImport('useToast', () => () => ({
  add: (toast: { title?: string }) => toasts.push(toast)
}));

const STUBS = {
  UTooltip: {
    name: 'UTooltip',
    props: ['text', 'disabled'],
    template: '<div><slot /></div>'
  },
  UDropdownMenu: {
    name: 'UDropdownMenu',
    props: ['items'],
    template: '<div><slot /></div>'
  }
};

// * Every test here runs the labelled tier — the only one that renders a text label, and so
// * the only one whose markup can be asserted without measuring a viewport. The other two
// * differ by a class list, which CSS decides and no mount can exercise.
function withStore(setup: () => void) {
  return defineComponent({
    setup() {
      setup();

      return () => h(AuthMenu, { tier: 'labelled' });
    }
  });
}

const ALICE = { uid: 'u1', email: 'alice@example.com', displayName: 'Alice' };

describe('AuthMenu', () => {
  beforeEach(() => {
    toasts.length = 0;
  });

  it('reserves the slot rather than guessing while the SDK has not reported', async () => {
    const page = await mountSuspended(AuthMenu, { global: { stubs: STUBS } });

    // ! Invisible, not absent: the button holds its geometry so the header does not reflow
    // ! when the store resolves (feature 004, Examples — "no layout shift").
    const button = page.get('button');
    expect(button.classes()).toContain('invisible');
    expect(button.attributes('aria-hidden')).toBe('true');
    expect(button.attributes('tabindex')).toBe('-1');
  });

  it('offers sign-in once the store resolves to anonymous', async () => {
    const page = await mountSuspended(
      withStore(() => useAuthStore().resetUser()),
      { global: { stubs: STUBS } }
    );

    const button = page.get('button');
    expect(button.classes()).not.toContain('invisible');
    expect(button.attributes('aria-hidden')).toBeUndefined();
    expect(page.text()).toContain('Sign in');
  });

  it('disables sign-in when the SDK never initialised', async () => {
    // ! Not arranged — observed. The Firebase plugin has no project config in a test
    // ! environment, so it flags sign-in unavailable for real, which is exactly the
    // ! degradation feature 006 asks for: a disabled button with a reason, never one that
    // ! cannot work. Popup behaviour is proven in `test/unit/useAuth.test.ts` instead.
    const page = await mountSuspended(
      withStore(() => useAuthStore().resetUser()),
      { global: { stubs: STUBS } }
    );

    expect(page.get('button').attributes('disabled')).toBeDefined();

    // * The labelled tier still reads "Sign in" on the button, so the tooltip is the only
    // * place that can say why it does nothing — which is why it is not suppressed here.
    const tooltip = page.findComponent({ name: 'UTooltip' });
    expect(tooltip.props('text')).toBe('Sign-in is unavailable');
    expect(tooltip.props('disabled')).toBe(false);
  });

  it('shows the account name and its menu once signed in', async () => {
    const page = await mountSuspended(
      withStore(() => useAuthStore().setUser(ALICE)),
      { global: { stubs: STUBS } }
    );

    expect(page.text()).toContain('Alice');

    const groups = page
      .findComponent({ name: 'UDropdownMenu' })
      .props('items') as { label: string }[][];

    expect(groups.flat().map((item) => item.label)).toEqual([
      'My builds',
      'Sign out',
      'Delete account...'
    ]);
  });

  it('falls back to the email when Google has no display name', async () => {
    const page = await mountSuspended(
      withStore(() => useAuthStore().setUser({ ...ALICE, displayName: null })),
      { global: { stubs: STUBS } }
    );

    expect(page.text()).toContain('alice@example.com');
  });
});
