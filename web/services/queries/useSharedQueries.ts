import { fetchSharedBuild } from '@/services/shared.api';

import type { PublicBuild } from '@/types/api';

export const sharedQueryKeys = {
  fetchSharedBuild: ['shared', 'get']
} as const;

export function useFetchSharedBuild(
  id: Ref<string>,
  options: Omit<AppQueryOptions<PublicBuild>, 'key' | 'query'> = {}
) {
  return useAppQuery<PublicBuild>({
    key: () => [...sharedQueryKeys.fetchSharedBuild, id.value],
    query: () => fetchSharedBuild(id.value),
    ...options
  });
}
