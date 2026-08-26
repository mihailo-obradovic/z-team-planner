import type { Ref } from 'vue';

import { fetchSharedBuild } from '@/services/shared.api';
import type { PublicBuild } from '@/types/api';
import type { AppQueryOptions } from '@/composables/useAppQuery';

export const sharedQueryKeys = {
  fetchSharedBuild: ['shared', 'get']
} as const;

export function useFetchSharedBuild(
  id: Ref<string>,
  options: Omit<AppQueryOptions<PublicBuild>, 'key' | 'query'> = {}
) {
  // * No `enabled` gate on auth: the public read works signed out, which is the whole point
  // * of a share link. Nothing here invalidates anything either (feature 007).
  return useAppQuery<PublicBuild>({
    key: () => [...sharedQueryKeys.fetchSharedBuild, id.value],
    query: () => fetchSharedBuild(id.value),
    ...options
  });
}
