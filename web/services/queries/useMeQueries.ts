import { useQueryCache } from '@pinia/colada';

import { chainOnSettled } from '@/services/queries/chainOnSettled';
import { deleteMe, fetchMe } from '@/services/me.api';

import type { Me } from '@/types/api';

export const meQueryKeys = {
  fetchMe: ['me']
} as const;

export function useFetchMe(
  options: Omit<AppQueryOptions<Me>, 'key' | 'query'> = {}
) {
  const { isSignedIn } = storeToRefs(useAuthStore());

  return useAppQuery<Me>({
    key: meQueryKeys.fetchMe,
    query: () => fetchMe(),
    enabled: () => isSignedIn.value,
    ...options
  });
}

export function useDeleteMe(
  options: Omit<AppMutationOptions<void, void>, 'mutation'> = {}
) {
  const queryCache = useQueryCache();

  return useAppMutation<void, void>({
    mutation: () => deleteMe(),
    ...options,
    onSettled: chainOnSettled(async (_data, error) => {
      if (!error) {
        await queryCache.invalidateQueries({ key: ['builds'] });
        await queryCache.invalidateQueries({ key: meQueryKeys.fetchMe });
      }
    }, options.onSettled)
  });
}
