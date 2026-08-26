import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime';
import { useQueryCache } from '@pinia/colada';
import { defineComponent, h } from 'vue';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import AccountDialogs from '@/components/_shared/AccountDialogs.vue';
import { useAuthStore } from '@/stores/useAuthStore';

const fetchMeSpy = vi.fn<() => Promise<unknown>>();
const deleteMeSpy = vi.fn<() => Promise<void>>();

vi.mock('@/services/me.api', () => ({
  fetchMe: () => fetchMeSpy(),
  deleteMe: () => deleteMeSpy()
}));

vi.mock('@/services/builds.api', () => ({
  fetchBuilds: vi.fn<() => Promise<never>>(),
  fetchBuild: vi.fn<() => Promise<never>>(),
  createBuild: vi.fn<() => Promise<never>>(),
  updateBuild: vi.fn<() => Promise<never>>(),
  deleteBuild: vi.fn<() => Promise<never>>(),
  importBuilds: vi.fn<() => Promise<never>>()
}));

const signOutSpy = vi.fn<() => Promise<void>>();
mockNuxtImport('useAuth', () => () => ({
  signIn: vi.fn<() => Promise<void>>(),
  signOut: signOutSpy
}));

mockNuxtImport('useRoute', () => () => ({ path: '/', params: {}, query: {} }));

const toasts: { title?: string }[] = [];
mockNuxtImport('useToast', () => () => ({
  add: (toast: { title?: string }) => toasts.push(toast)
}));

// * UModal teleports and only renders its slots when open; stubbing it renders the body and
// * footer inline, which is where everything under test lives.
const STUBS = {
  UModal: { template: '<div><slot name="body" /><slot name="footer" /></div>' }
};

function profile(buildCount: number) {
  return {
    display_name: 'Alice',
    email: 'alice@example.com',
    created_at: '2026-08-26T07:00:00.000000Z',
    build_count: buildCount
  };
}

async function openDialog() {
  return await mountSuspended(
    defineComponent({
      setup() {
        // ! Inside the component's own Pinia and Nuxt state — a store or `useState` created in
        // ! the test body is a different instance and every assertion would be vacuous.
        useAuthStore().setUser({
          uid: 'u1',
          email: 'alice@example.com',
          displayName: 'Alice'
        });
        useAccountDialogs().deleteAccountOpen.value = true;
        // * The query cache outlives a mount, so without this every test after the first
        // * would read the first one's profile instead of its own.
        void useQueryCache().invalidateQueries({ key: ['me'] });

        return () => h(AccountDialogs);
      }
    }),
    { global: { stubs: STUBS } }
  );
}

describe('AccountDialogs', () => {
  beforeEach(() => {
    fetchMeSpy.mockReset();
    deleteMeSpy.mockReset();
    signOutSpy.mockReset();
    deleteMeSpy.mockResolvedValue(undefined);
    signOutSpy.mockResolvedValue(undefined);
    toasts.length = 0;
  });

  it('names the build count that goes with the account', async () => {
    fetchMeSpy.mockResolvedValue(profile(3));

    const page = await openDialog();

    await vi.waitFor(() => expect(page.text()).toContain('the 3 builds'));
    // * The share links are the part a stranger notices, so the warning is only shown when
    // * there is something to warn about.
    expect(page.text()).toContain('share links will stop working');
    expect(page.text()).toContain(
      'Builds saved in this browser are not affected'
    );
  });

  it('says so when the account holds nothing', async () => {
    fetchMeSpy.mockResolvedValue(profile(0));

    const page = await openDialog();

    await vi.waitFor(() =>
      expect(page.text()).toContain('There are no builds saved to it')
    );
    expect(page.text()).not.toContain('share links will stop working');
  });

  it('counts one build in the singular', async () => {
    fetchMeSpy.mockResolvedValue(profile(1));

    const page = await openDialog();

    await vi.waitFor(() => expect(page.text()).toContain('the 1 build '));
  });

  it('deletes, then signs out, then says so', async () => {
    fetchMeSpy.mockResolvedValue(profile(2));

    const page = await openDialog();
    await vi.waitFor(() => expect(page.text()).toContain('the 2 builds'));

    const confirm = page
      .findAll('button')
      .find((button) => button.text() === 'Delete account');
    await confirm?.trigger('click');

    await vi.waitFor(() => expect(deleteMeSpy).toHaveBeenCalledOnce());
    await vi.waitFor(() => expect(signOutSpy).toHaveBeenCalledOnce());
    expect(toasts[0]?.title).toBe('Your account has been deleted');
    expect(useAccountDialogs().deleteAccountOpen.value).toBe(false);
  });

  it('leaves the user signed in when the delete fails', async () => {
    fetchMeSpy.mockResolvedValue(profile(2));
    deleteMeSpy.mockRejectedValue(
      Object.assign(new Error('unavailable'), { statusCode: 503 })
    );

    const page = await openDialog();
    await vi.waitFor(() => expect(page.text()).toContain('the 2 builds'));

    const confirm = page
      .findAll('button')
      .find((button) => button.text() === 'Delete account');
    await confirm?.trigger('click');

    await vi.waitFor(() => expect(deleteMeSpy).toHaveBeenCalledOnce());

    // ! The account still exists — signing out here would strand the user outside an account
    // ! they still have (feature 004, Error Handling: 503, nothing deleted).
    expect(signOutSpy).not.toHaveBeenCalled();
    expect(useAccountDialogs().deleteAccountOpen.value).toBe(true);
  });
});
