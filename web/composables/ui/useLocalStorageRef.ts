import type { Ref } from 'vue';

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
