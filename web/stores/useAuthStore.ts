import type { AuthStatus, AuthUser } from '@/types/auth';

// * Identity and the active account build — the two things no server owns. Server state lives
// * in the query cache; this store never holds a build (feature 006, Invariants).
export const useAuthStore = defineStore('auth', () => {
  // * Starts `unknown` so the prerendered page renders a reserved slot rather than guessing,
  // * and the server render and first client render agree (feature 004).
  const status = ref<AuthStatus>('unknown');
  const user = ref<AuthUser | null>(null);
  const activeAccountBuildId = ref<string | null>(null);

  // * Set when the Firebase SDK cannot initialise. Status stays `unknown` in that case, so a
  // * separate flag is what lets the header disable sign-in instead of waiting forever.
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
    // * Dropped with the session: it identifies a build only this user could open.
    activeAccountBuildId.value = null;
  }

  function setActiveAccountBuildId(id: string | null) {
    activeAccountBuildId.value = id;
  }

  function markSignInUnavailable() {
    isSignInUnavailable.value = true;
  }

  return {
    status: readonly(status),
    user: readonly(user),
    activeAccountBuildId: readonly(activeAccountBuildId),
    isSignInUnavailable: readonly(isSignInUnavailable),
    isSignedIn,
    isResolved,
    setUser,
    resetUser,
    setActiveAccountBuildId,
    markSignInUnavailable
  };
});
