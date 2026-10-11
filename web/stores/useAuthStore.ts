import { skipHydrate } from 'pinia';

import { forgetSession, rememberSession } from '@/utils/sessionMarker';

import type { AuthStatus, AuthUser, SignInAvailability } from '@/types/auth';

export const useAuthStore = defineStore('auth', () => {
  const status = ref<AuthStatus>('unknown');
  const user = ref<AuthUser | null>(null);

  const isSignInUnavailable = ref(false);

  // * Whether the next sign-out is one the user asked for (the profile menu, account deletion) rather than a session that ended (feature 029). Intent, not status: the subscription still reports the sign-out itself.
  const isSignOutChosen = ref(false);

  const isSignedIn = computed(() => status.value === 'signed-in');
  const isResolved = computed(() => status.value !== 'unknown');

  // * Where a new build goes is known: the status resolved, or this deployment has no sign-in at all and the status never will (feature 029).
  const isDestinationKnown = computed(
    () => isResolved.value || isSignInUnavailable.value
  );

  // * The session marker follows the status (decision 017): written here and cleared below, so the next load knows before the SDK whether to load it at all.
  function setUser(next: AuthUser) {
    user.value = next;
    status.value = 'signed-in';
    isSignOutChosen.value = false;
    rememberSession();
  }

  function chooseSignOut() {
    isSignOutChosen.value = true;
  }

  function resetUser() {
    user.value = null;
    status.value = 'anonymous';
    forgetSession();
  }

  function setSignInAvailability(availability: SignInAvailability) {
    isSignInUnavailable.value = availability === 'unavailable';
  }

  return {
    status: skipHydrate(readonly(status)),
    user: skipHydrate(readonly(user)),
    isSignInUnavailable: skipHydrate(readonly(isSignInUnavailable)),
    isSignOutChosen: skipHydrate(readonly(isSignOutChosen)),
    isSignedIn,
    isResolved,
    isDestinationKnown,
    setUser,
    resetUser,
    chooseSignOut,
    setSignInAvailability
  };
});
