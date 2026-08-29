import { initializeApp } from 'firebase/app';
import {
  type Auth,
  connectAuthEmulator,
  getAuth,
  onAuthStateChanged
} from 'firebase/auth';

import { clearUserScopedCache } from '@/services/queries/clearUserScopedCache';

import type { Pinia } from 'pinia';

export default defineNuxtPlugin((nuxtApp) => {
  const { setUser, resetUser, markSignInUnavailable } = useAuthStore();
  const { firebase } = useRuntimeConfig().public;

  // * Null when initialisation failed; the fetcher reads this and simply sends no token.
  let auth: Auth | null = null;

  try {
    auth = getAuth(
      initializeApp({
        apiKey: firebase.apiKey,
        authDomain: firebase.authDomain,
        projectId: firebase.projectId,
        appId: firebase.appId
      })
    );
    if (firebase.authEmulatorHost) {
      connectAuthEmulator(auth, `http://${firebase.authEmulatorHost}`, {
        disableWarnings: true
      });
    }
  } catch (error) {
    console.error(
      'Firebase failed to initialise; sign-in is unavailable.',
      error
    );
    markSignInUnavailable();
  }

  if (auth) {
    onAuthStateChanged(
      auth,
      (user) => {
        if (!user) {
          resetUser();
          clearUserScopedCache(nuxtApp.$pinia as Pinia);

          return;
        }

        setUser({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName
        });
      },
      (error) => {
        console.error('Firebase auth state subscription failed.', error);
        markSignInUnavailable();
      }
    );
  }

  return {
    provide: { firebaseAuth: auth }
  };
});
