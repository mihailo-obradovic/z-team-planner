import { clearUserScopedCache } from '@/services/queries/clearUserScopedCache';
import { loadFirebaseSdk } from '@/utils/firebaseSdk';
import { hasStoredSession } from '@/utils/sessionMarker';

import type { Auth } from 'firebase/auth';
import type { Pinia } from 'pinia';

export default defineNuxtPlugin((nuxtApp) => {
  const { setUser, resetUser, setSignInAvailability } = useAuthStore();
  const { firebase, apiBaseUrl } = useRuntimeConfig().public;

  // * An empty base URL is a deployment with no API behind it (decision 007, stage 1). Signing in would succeed against Google and then fail against nothing, so Firebase is never initialised — which also stops a stale session from resurrecting into an app that cannot serve it. The status stays `unknown`, exactly as when initialisation fails below — so availability, not status, is what AuthMenu reads to drop the control entirely instead of holding a slot the SDK will never fill.
  if (!apiBaseUrl) {
    setSignInAvailability('unavailable');

    return {
      provide: { firebaseAuth: async (): Promise<Auth | null> => null }
    };
  }

  // * One initialisation per page load, whoever asks first: the boot (a stored session), a Sign in click, or a request that needs a token.
  let initialising: Promise<Auth | null> | null = null;

  function firebaseAuth(): Promise<Auth | null> {
    initialising ??= initialise();

    return initialising;
  }

  // * Decision 017: the SDK is loaded only when a session may exist. The marker says so; without it the store resolves `anonymous` at once, and the SDK first loads on a Sign in click. The resolution waits for the mount so the first client render still matches the prerendered `unknown` header (feature 004).
  nuxtApp.hook('app:mounted', () => {
    if (hasStoredSession()) {
      void firebaseAuth();

      return;
    }

    resetUser();
  });

  async function initialise(): Promise<Auth | null> {
    const sdk = await loadFirebaseSdk();

    // * Null when initialisation failed; the fetcher reads this and simply sends no token.
    let auth: Auth | null = null;

    try {
      auth = sdk.auth.getAuth(
        sdk.app.initializeApp({
          apiKey: firebase.apiKey,
          authDomain: firebase.authDomain,
          projectId: firebase.projectId,
          appId: firebase.appId
        })
      );
      if (firebase.authEmulatorHost) {
        sdk.auth.connectAuthEmulator(
          auth,
          `http://${firebase.authEmulatorHost}`,
          { disableWarnings: true }
        );
      }
    } catch (error) {
      console.error(
        'Firebase failed to initialise; sign-in is unavailable.',
        error
      );
      setSignInAvailability('unavailable');
    }

    if (auth) {
      sdk.auth.onAuthStateChanged(
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
          setSignInAvailability('unavailable');
        }
      );
    }

    return auth;
  }

  return {
    provide: { firebaseAuth }
  };
});
