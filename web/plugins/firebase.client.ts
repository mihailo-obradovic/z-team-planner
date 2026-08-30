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
  const { firebase, apiBaseUrl } = useRuntimeConfig().public;

  // * An empty base URL is a deployment with no API behind it (decision 007, stage 1). Signing in would succeed against Google and then fail against nothing, so Firebase is never initialised — which also stops a stale session from resurrecting into an app that cannot serve it. The status stays `unknown`, exactly as when initialisation fails below: the SDK never reports, so AuthMenu keeps the slot reserved and empty rather than offering a control that cannot work.
  if (!apiBaseUrl) {
    markSignInUnavailable();

    return { provide: { firebaseAuth: null } };
  }

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
