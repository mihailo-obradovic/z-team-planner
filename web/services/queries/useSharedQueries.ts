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
    query: () => fetchSharedBuild(id.value),
    ...options
  });
}
