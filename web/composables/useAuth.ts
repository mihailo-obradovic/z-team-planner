import { loadFirebaseSdk } from '@/utils/firebaseSdk';

const POPUP_BLOCKED =
  'Your browser blocked the sign-in window. Allow pop-ups for this site and try again.';
const SIGN_IN_FAILED = 'Sign-in failed. Please try again.';

const SILENT_CODES = [
  'auth/popup-closed-by-user',
  'auth/cancelled-popup-request'
];

export function useAuth() {
  const toast = useToast();

  // * The SDK may still be loading on a cold cache (decision 017): the click awaits it, then opens the popup — a blocker that closes on that gap is reported like any other blocked popup.
  async function signIn(): Promise<void> {
    const { $firebaseAuth } = useNuxtApp();
    const auth = await $firebaseAuth();

    if (!auth) {
      toast.add({ title: SIGN_IN_FAILED, color: 'error' });

      return;
    }

    const { GoogleAuthProvider, signInWithPopup } = (await loadFirebaseSdk())
      .auth;

    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
    } catch (error) {
      const code = errorCode(error);

      if (SILENT_CODES.includes(code)) {
        return;
      }

      toast.add({
        title: code === 'auth/popup-blocked' ? POPUP_BLOCKED : SIGN_IN_FAILED,
        color: 'error'
      });
    }
  }

  async function signOutOfAccount(): Promise<void> {
    const { $firebaseAuth } = useNuxtApp();
    const auth = await $firebaseAuth();

    if (!auth) {
      return;
    }

    const { signOut } = (await loadFirebaseSdk()).auth;

    // * Marked before the SDK call, so the subscription's sign-out is read as chosen, not as a session that ended.
    useAuthStore().chooseSignOut();
    await signOut(auth);
  }

  return { signIn, signOut: signOutOfAccount };
}

function errorCode(error: unknown): string {
  return typeof error === 'object' && error !== null
    ? ((error as { code?: string }).code ?? '')
    : '';
}
