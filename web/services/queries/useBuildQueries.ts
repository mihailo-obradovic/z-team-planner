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

// * Everything a mutation touches lives under ['builds'], so invalidating the root covers the list and every cached build in one call.
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
    // * Never fires while the store is `unknown` or `anonymous`: a signed-out load makes no request at all (feature 008, Examples).
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
    // * Generated per call, inside the hook — the fetcher's own 401 retry reuses the same request options, so the replay carries this key and cannot create a second build.
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
      // * The ETag comes from the cached build, so a component never sees one (feature 008).
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
      // * Store side effects belong to the query layer, not to services or components.
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
