import { fetchSharedBuild } from '@/services/shared.api';

import type { SharedBuild } from '@/types/api';

export const sharedQueryKeys = {
  fetchSharedBuild: ['shared', 'get']
} as const;

export function useFetchSharedBuild(
  id: Ref<string>,
  options: Omit<AppQueryOptions<SharedBuild>, 'key' | 'query'> = {}
) {
  return useAppQuery<SharedBuild>({
    key: () => [...sharedQueryKeys.fetchSharedBuild, id.value],
    query: ({ signal }) => fetchSharedBuild(id.value, signal),
    // ! Never re-read while open: the owner's edits and deletion reach a share page on its next load, not over what is on screen (feature 007). A background read answering `404` would otherwise replace the build with the error page.
    staleTime: Infinity,
    ...options
  });
}
