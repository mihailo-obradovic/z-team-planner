import { useQueryCache } from '@pinia/colada';

import { chainOnSettled } from '@/services/queries/chainOnSettled';
import {
  createBuild,
  deleteBuild,
  fetchBuild,
  fetchBuilds,
  importBuilds,
  updateBuild
} from '@/services/builds.api';

import type {
  CloudBuild,
  CloudBuildList,
  CreateBuildPayload,
  ImportBuildsPayload,
  ImportReport,
  UpdateBuildPayload
} from '@/types/api';

export const buildsQueryKeys = {
  fetchBuilds: ['builds', 'fetch'],
  fetchBuild: ['builds', 'get']
} as const;

export const BUILDS_ROOT = ['builds'];

type MutationOptions<TData, TVars> = Omit<
  AppMutationOptions<TData, TVars>,
  'mutation'
>;

function newIdempotencyKey(): string {
  return crypto.randomUUID();
}

export function useFetchBuilds(
  options: Omit<AppQueryOptions<CloudBuildList>, 'key' | 'query'> = {}
) {
  const { isSignedIn } = storeToRefs(useAuthStore());

  return useAppQuery<CloudBuildList>({
    key: () => [...buildsQueryKeys.fetchBuilds],
    query: () => fetchBuilds(),
    enabled: () => isSignedIn.value,
    ...options
  });
}

export function useFetchBuild(
  id: Ref<string | null>,
  options: Omit<AppQueryOptions<CloudBuild>, 'key' | 'query'> = {}
) {
  const { isSignedIn } = storeToRefs(useAuthStore());

  return useAppQuery<CloudBuild>({
    key: () => [...buildsQueryKeys.fetchBuild, id.value ?? ''],
    query: () => fetchBuild(id.value as string),
    enabled: () => isSignedIn.value && !!id.value,
    ...options
  });
}

export function useCreateBuild(
  options: MutationOptions<CloudBuild, CreateBuildPayload> = {}
) {
  const queryCache = useQueryCache();

  return useAppMutation<CloudBuild, CreateBuildPayload>({
    mutation: (payload) => createBuild(payload, newIdempotencyKey()),
    ...options,
    onSettled: chainOnSettled(
      async () => await queryCache.invalidateQueries({ key: BUILDS_ROOT }),
      options.onSettled
    )
  });
}

export function useUpdateBuild(
  options: MutationOptions<
    CloudBuild,
    { id: string; payload: UpdateBuildPayload }
  > = {}
) {
  const queryCache = useQueryCache();

  return useAppMutation<
    CloudBuild,
    { id: string; payload: UpdateBuildPayload }
  >({
    mutation: ({ id, payload }) => {
      const cached = queryCache.getQueryData<CloudBuild>([
        ...buildsQueryKeys.fetchBuild,
        id
      ]);

      return updateBuild(id, payload, cached?.updated_at ?? '');
    },
    ...options,
    onSettled: chainOnSettled(
      async () => await queryCache.invalidateQueries({ key: BUILDS_ROOT }),
      options.onSettled
    )
  });
}

export function useDeleteBuild(options: MutationOptions<void, string> = {}) {
  const queryCache = useQueryCache();
  const { activeAccountBuildId } = storeToRefs(useAuthStore());
  const { setActiveAccountBuildId } = useAuthStore();

  return useAppMutation<void, string>({
    mutation: (id) => deleteBuild(id),
    ...options,
    onSettled: chainOnSettled(async (_data, error, id) => {
      if (!error && activeAccountBuildId.value === id) {
        setActiveAccountBuildId(null);
      }

      await queryCache.invalidateQueries({ key: BUILDS_ROOT });
    }, options.onSettled)
  });
}

export function useImportBuilds(
  options: MutationOptions<ImportReport, ImportBuildsPayload> = {}
) {
  const queryCache = useQueryCache();

  return useAppMutation<ImportReport, ImportBuildsPayload>({
    mutation: (payload) => importBuilds(payload, newIdempotencyKey()),
    ...options,
    onSettled: chainOnSettled(
      async () => await queryCache.invalidateQueries({ key: BUILDS_ROOT }),
      options.onSettled
    )
  });
}
