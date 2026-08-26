import { initializeApp } from 'firebase/app';
import {
  type Auth,
  connectAuthEmulator,
  getAuth,
  onAuthStateChanged
} from 'firebase/auth';

// ! Client-only by filename. The Firebase SDK is a browser SDK, and the server must never hold
// ! a user's token — feature 006: the server never calls the API and nothing is forwarded.
export default defineNuxtPlugin(() => {
  const authStore = useAuthStore();
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
      // * Points the SDK at the local emulator so its tokens match the ones the API accepts
      // * while it too is emulated. Never set outside development (nuxt.config.ts).
      connectAuthEmulator(auth, `http://${firebase.authEmulatorHost}`, {
        disableWarnings: true
      });
    }
  } catch (error) {
    // * The anonymous app keeps working: status stays `unknown`, and the header disables
    // * sign-in with a tooltip rather than offering a button that cannot work (feature 006).
    console.error(
      'Firebase failed to initialise; sign-in is unavailable.',
      error
    );
    authStore.markSignInUnavailable();
  }

  if (auth) {
    // * The single source of auth truth. It fires once on load with the restored user or null,
    // * which is what moves the store off `unknown`, and again on every sign-in and sign-out —
    // * including one triggered in another tab.
    onAuthStateChanged(
      auth,
      (user) => {
        if (!user) {
          authStore.resetUser();

          return;
        }

        authStore.setUser({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName
        });
      },
      (error) => {
        console.error('Firebase auth state subscription failed.', error);
        authStore.markSignInUnavailable();
      }
    );
  }

  return {
    provide: { firebaseAuth: auth }
  };
});
