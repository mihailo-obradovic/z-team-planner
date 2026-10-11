// * Decision 017: whether a Firebase session may exist in this browser, known before the SDK is loaded. Written at `signed-in`, cleared at `anonymous`, by the auth store alone. Holds no identity — its presence is the whole fact.
export const SESSION_MARKER_KEY = 'z-team-session';

export function hasStoredSession(): boolean {
  try {
    return localStorage.getItem(SESSION_MARKER_KEY) !== null;
  } catch {
    // * Unreadable storage reads as no session: the SDK loads on a Sign in click and restores one if it is there.
    return false;
  }
}

export function rememberSession(): void {
  try {
    localStorage.setItem(SESSION_MARKER_KEY, '1');
  } catch {
    // * A full quota loses the marker, not the session: the next visit asks for a sign-in rather than restoring it.
  }
}

export function forgetSession(): void {
  try {
    localStorage.removeItem(SESSION_MARKER_KEY);
  } catch {
    // * A stale marker costs the next visit one SDK load that reports anonymous.
  }
}
