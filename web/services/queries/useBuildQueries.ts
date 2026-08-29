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
  Build,
  BuildList,
  CreateBuildPayload,
  ImportBuildsPayload,
  ImportReport,
  UpdateBuildPayload
} from '@/types/api';

export const buildsQueryKeys = {
  fetchBuilds: ['builds', 'fetch'],
  fetchBuild: ['builds', 'get']
} as const;

const BUILDS_ROOT = ['builds'];

type MutationOptions<TData, TVars> = Omit<
  AppMutationOptions<TData, TVars>,
  'mutation'
>;

function newIdempotencyKey(): string {
  return crypto.randomUUID();
}

export function useFetchBuilds(
  options: Omit<AppQueryOptions<BuildList>, 'key' | 'query'> = {}
) {
  const { isSignedIn } = storeToRefs(useAuthStore());

  return useAppQuery<BuildList>({
    key: () => [...buildsQueryKeys.fetchBuilds],
    query: () => fetchBuilds(),
    enabled: () => isSignedIn.value,
    ...options
  });
}

export function useFetchBuild(
  id: Ref<string | null>,
  options: Omit<AppQueryOptions<Build>, 'key' | 'query'> = {}
) {
  const { isSignedIn } = storeToRefs(useAuthStore());

  return useAppQuery<Build>({
    key: () => [...buildsQueryKeys.fetchBuild, id.value ?? ''],
    query: () => fetchBuild(id.value as string),
    enabled: () => isSignedIn.value && !!id.value,
    ...options
  });
}

export function useCreateBuild(
  options: MutationOptions<Build, CreateBuildPayload> = {}
) {
  const queryCache = useQueryCache();

  return useAppMutation<Build, CreateBuildPayload>({
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
    Build,
    { id: string; payload: UpdateBuildPayload }
  > = {}
) {
  const queryCache = useQueryCache();

  return useAppMutation<Build, { id: string; payload: UpdateBuildPayload }>({
    mutation: ({ id, payload }) => {
      const cached = queryCache.getQueryData<Build>([
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
