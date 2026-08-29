import type { Ref } from 'vue';

// * A ref that reads itself from localStorage on the client and writes itself back on every change.
// * On the server it holds the default — which is why every component rendering this state sits inside `ClientOnly` (`web/CLAUDE.md`).
// ! Identity comes from `useState`, not from a fresh `ref`: two callers of the same key must be the same ref, or both would write the same localStorage entry from diverging values. The sync is installed once per key for the same reason.
export function useLocalStorageRef<T>(key: string, defaultValue: T): Ref<T> {
  const data = useState<T>(key, () => defaultValue);

  if (import.meta.client && !claimSync(key)) {
    try {
      const stored = localStorage.getItem(key);

      if (stored !== null) {
        data.value = JSON.parse(stored);
      }
    } catch {
      // * Corrupt or unreadable storage keeps the default rather than taking the app down.
    }

    // * Deep, because a record is edited in place rather than the array being replaced.
    watch(
      data,
      (value) => {
        try {
          localStorage.setItem(key, JSON.stringify(value));
        } catch {
          // * A full quota loses the write, not the session.
        }
      },
      { deep: true }
    );
  }

  return data;
}

// * True when this key already has its sync installed on this client.
function claimSync(key: string): boolean {
  const nuxtApp = useNuxtApp() as { _localStorageSynced?: Set<string> };
  const claimed = (nuxtApp._localStorageSynced ??= new Set<string>());

  if (claimed.has(key)) {
    return true;
  }

  claimed.add(key);

  return false;
}
