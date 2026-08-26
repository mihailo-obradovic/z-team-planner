import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';

// * Google is the only provider (feature 004, Non-goals). Apple and email + password are
// * backlog items, not a switch flipped here.
const PROVIDER = new GoogleAuthProvider();

const POPUP_BLOCKED =
  'Your browser blocked the sign-in window. Allow pop-ups for this site and try again.';
const SIGN_IN_FAILED = 'Sign-in failed. Please try again.';

// * Both mean the user changed their mind — the first by closing the window, the second by
// * opening a second one. Neither is a failure to report.
const SILENT_CODES = [
  'auth/popup-closed-by-user',
  'auth/cancelled-popup-request'
];

function errorCode(error: unknown): string {
  return typeof error === 'object' && error !== null
    ? ((error as { code?: string }).code ?? '')
    : '';
}

/**
 * Signing in and out.
 *
 * Neither function touches the auth store: `onAuthStateChanged` in the Firebase plugin is the
 * single source of auth truth, and it fires for both (feature 004). Writing the store here as
 * well would give the app two answers to "who is signed in" that can disagree.
 */
export function useAuth() {
  const toast = useToast();

  async function signIn(): Promise<void> {
    const { $firebaseAuth } = useNuxtApp();

    if (!$firebaseAuth) {
      // * The SDK never initialised; the store already knows and the header renders sign-in disabled, so this is only reached if something calls in anyway.
      toast.add({ title: SIGN_IN_FAILED, color: 'error' });

      return;
    }

    try {
      await signInWithPopup($firebaseAuth, PROVIDER);
    } catch (error) {
      const code = errorCode(error);

      if (SILENT_CODES.includes(code)) {
        return;
      }

      // ! No redirect fallback (feature 004, Edge Cases): the redirect flow leaves and re-enters the app, which would have to survive an unsaved planner state that the popup flow never disturbs.
      toast.add({
        title: code === 'auth/popup-blocked' ? POPUP_BLOCKED : SIGN_IN_FAILED,
        color: 'error'
      });
    }
  }

  async function signOutOfAccount(): Promise<void> {
    const { $firebaseAuth } = useNuxtApp();

    if (!$firebaseAuth) {
      return;
    }

    await signOut($firebaseAuth);
  }

  return { signIn, signOut: signOutOfAccount };
}
