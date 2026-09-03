import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';

import { useAuthStore } from '@/stores/useAuthStore';

const ALICE = {
  uid: 'uid-1',
  email: 'alice@example.com',
  displayName: 'Alice'
};

describe('useAuthStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('starts unknown so the prerendered header shows no wrong button', () => {
    const store = useAuthStore();

    expect(store.status).toBe('unknown');
    expect(store.isResolved).toBe(false);
    expect(store.isSignedIn).toBe(false);
    expect(store.user).toBeNull();
  });

  it('resolves unknown to anonymous when nobody is signed in', () => {
    const store = useAuthStore();

    store.resetUser();

    expect(store.status).toBe('anonymous');
    expect(store.isResolved).toBe(true);
    expect(store.isSignedIn).toBe(false);
  });

  it('resolves unknown to signed-in with the user', () => {
    const store = useAuthStore();

    store.setUser(ALICE);

    expect(store.status).toBe('signed-in');
    expect(store.isSignedIn).toBe(true);
    expect(store.user).toEqual(ALICE);
  });

  it('clears the active account build on sign-out', () => {
    const store = useAuthStore();
    store.setUser(ALICE);
    store.setActiveAccountBuildId('build-42');

    store.resetUser();

    // * It identifies a build only that user could open; keeping it across sign-out would leave the planner pointed at something the next visitor cannot load.
    expect(store.activeAccountBuildId).toBeNull();
    expect(store.user).toBeNull();
  });

  it('keeps the active account build across an ordinary update', () => {
    const store = useAuthStore();
    store.setUser(ALICE);
    store.setActiveAccountBuildId('build-42');

    store.setUser({ ...ALICE, displayName: 'Alice B' });

    expect(store.activeAccountBuildId).toBe('build-42');
  });

  it('stays unknown but flags sign-in unavailable when the SDK fails', () => {
    const store = useAuthStore();

    store.setSignInAvailability('unavailable');

    // ! Not `anonymous`: the app never learned whether anyone is signed in. The header disables the button rather than offering one that cannot work.
    expect(store.status).toBe('unknown');
    expect(store.isSignInUnavailable).toBe(true);
  });

  it('ignores a direct write, so actions are the only mutation path', () => {
    const store = useAuthStore();

    // ! Vue's readonly() enforces this at runtime (the write is dropped with a warning), but Pinia's store type does not surface it as a compile error — so the guarantee is only as good as this assertion. Do not replace it with a type-level check.
    (store as { status: string }).status = 'signed-in';

    expect(store.status).toBe('unknown');
  });
});
