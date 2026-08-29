import { initializeApp } from 'firebase/app';
import {
  type Auth,
  connectAuthEmulator,
  getAuth,
  onAuthStateChanged
} from 'firebase/auth';

import { clearUserScopedCache } from '@/services/queries/clearUserScopedCache';

import type { Pinia } from 'pinia';

// ! Client-only by filename. The Firebase SDK is a browser SDK, and the server must never hold a user's token — feature 006: the server never calls the API and nothing is forwarded.
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
      // * Points the SDK at the local emulator so its tokens match the ones the API accepts while it too is emulated. Never set outside development (nuxt.config.ts).
      connectAuthEmulator(auth, `http://${firebase.authEmulatorHost}`, {
        disableWarnings: true
      });
    }
  } catch (error) {
    // * The anonymous app keeps working: status stays `unknown`, and the header disables sign-in with a tooltip rather than offering a button that cannot work (feature 006).
    console.error(
      'Firebase failed to initialise; sign-in is unavailable.',
      error
    );
    markSignInUnavailable();
  }

  if (auth) {
    // * The single source of auth truth. It fires once on load with the restored user or null, which is what moves the store off `unknown`, and again on every sign-in and sign-out — including one triggered in another tab.
    onAuthStateChanged(
      auth,
      (user) => {
        if (!user) {
          resetUser();
          // * The store flip only disables the queries; their data survives it. Dropping it here
          // * is what makes sign-out mean the previous account leaves no trace on this browser.
          // * Cast because `$pinia` reaches this file as `unknown`; the subscription fires long
          // * after setup, so the instance has to be handed over rather than inferred.
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
