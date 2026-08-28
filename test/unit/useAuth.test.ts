import { beforeEach, describe, expect, it, vi } from 'vitest';

const signInWithPopup = vi.fn<(...args: unknown[]) => Promise<unknown>>();
const signOut = vi.fn<(...args: unknown[]) => Promise<unknown>>();

vi.mock('firebase/auth', () => ({
  GoogleAuthProvider: class {},
  signInWithPopup: (...args: unknown[]) => signInWithPopup(...args),
  signOut: (...args: unknown[]) => signOut(...args)
}));

const toasts: { title?: string; color?: string }[] = [];
let firebaseAuth: object | null = { name: 'test' };

// * Stubbed rather than mounted: the Firebase client plugin cannot initialise in a test environment (no project config), so a component mount would only ever exercise the sign-in-unavailable path. This is where the popup outcomes are provable.
vi.stubGlobal('useNuxtApp', () => ({ $firebaseAuth: firebaseAuth }));
vi.stubGlobal('useToast', () => ({
  add: (toast: { title?: string; color?: string }) => toasts.push(toast)
}));

const { useAuth } = await import('@/composables/useAuth');

function popupError(code: string): { code: string } {
  return { code };
}

describe('useAuth', () => {
  beforeEach(() => {
    signInWithPopup.mockReset();
    signOut.mockReset();
    signInWithPopup.mockResolvedValue(undefined);
    signOut.mockResolvedValue(undefined);
    firebaseAuth = { name: 'test' };
    toasts.length = 0;
  });

  it('signs in through the popup and says nothing on success', async () => {
    await useAuth().signIn();

    expect(signInWithPopup).toHaveBeenCalledOnce();
    // * The store is deliberately not written here: onAuthStateChanged is the single source of auth truth and fires for this sign-in (feature 004).
    expect(toasts).toEqual([]);
  });

  it('explains a blocked popup rather than throwing', async () => {
    signInWithPopup.mockRejectedValue(popupError('auth/popup-blocked'));

    await useAuth().signIn();

    expect(toasts[0]?.title).toContain('blocked the sign-in window');
    expect(toasts[0]?.color).toBe('error');
  });

  it.each(['auth/popup-closed-by-user', 'auth/cancelled-popup-request'])(
    'says nothing when the user changes their mind (%s)',
    async (code) => {
      signInWithPopup.mockRejectedValue(popupError(code));

      await useAuth().signIn();

      expect(toasts).toEqual([]);
    }
  );

  it('falls back to a generic message for any other failure', async () => {
    signInWithPopup.mockRejectedValue(
      popupError('auth/network-request-failed')
    );

    await useAuth().signIn();

    expect(toasts[0]?.title).toBe('Sign-in failed. Please try again.');
  });

  it('reports rather than reaching for an SDK that never initialised', async () => {
    firebaseAuth = null;

    await useAuth().signIn();

    expect(signInWithPopup).not.toHaveBeenCalled();
    expect(toasts[0]?.title).toBe('Sign-in failed. Please try again.');
  });

  it('signs out through the SDK', async () => {
    await useAuth().signOut();

    expect(signOut).toHaveBeenCalledOnce();
  });

  it('signing out without an SDK is a no-op, not a crash', async () => {
    firebaseAuth = null;

    await useAuth().signOut();

    expect(signOut).not.toHaveBeenCalled();
  });
});
