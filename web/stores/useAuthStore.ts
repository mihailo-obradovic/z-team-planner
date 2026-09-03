import { skipHydrate } from 'pinia';

import type { AuthStatus, AuthUser, SignInAvailability } from '@/types/auth';

export const useAuthStore = defineStore('auth', () => {
  const status = ref<AuthStatus>('unknown');
  const user = ref<AuthUser | null>(null);
  const activeAccountBuildId = ref<string | null>(null);

  const isSignInUnavailable = ref(false);

  const isSignedIn = computed(() => status.value === 'signed-in');
  const isResolved = computed(() => status.value !== 'unknown');

  function setUser(next: AuthUser) {
    user.value = next;
    status.value = 'signed-in';
  }

  function resetUser() {
    user.value = null;
    status.value = 'anonymous';
    activeAccountBuildId.value = null;
  }

  function setActiveAccountBuildId(id: string | null) {
    activeAccountBuildId.value = id;
  }

  function setSignInAvailability(availability: SignInAvailability) {
    isSignInUnavailable.value = availability === 'unavailable';
  }

  return {
    status: skipHydrate(readonly(status)),
    user: skipHydrate(readonly(user)),
    activeAccountBuildId: skipHydrate(readonly(activeAccountBuildId)),
    isSignInUnavailable: skipHydrate(readonly(isSignInUnavailable)),
    isSignedIn,
    isResolved,
    setUser,
    resetUser,
    setActiveAccountBuildId,
    setSignInAvailability
  };
});
