import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';

const PROVIDER = new GoogleAuthProvider();

const POPUP_BLOCKED =
  'Your browser blocked the sign-in window. Allow pop-ups for this site and try again.';
const SIGN_IN_FAILED = 'Sign-in failed. Please try again.';

const SILENT_CODES = [
  'auth/popup-closed-by-user',
  'auth/cancelled-popup-request'
];

export function useAuth() {
  const toast = useToast();

  async function signIn(): Promise<void> {
    const { $firebaseAuth } = useNuxtApp();

    if (!$firebaseAuth) {
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

function errorCode(error: unknown): string {
  return typeof error === 'object' && error !== null
    ? ((error as { code?: string }).code ?? '')
    : '';
}
