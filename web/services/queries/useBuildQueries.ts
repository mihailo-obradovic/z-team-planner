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
import type { LocalBuild } from '@/types/build';

export const buildsQueryKeys = {
  fetchBuilds: ['builds', 'fetch'],
  fetchBuild: ['builds', 'get'],
  fetchNameMatches: ['builds', 'name-matches']
} as const;

export const BUILDS_ROOT = ['builds'];

type MutationOptions<TData, TVars> = Omit<
  AppMutationOptions<TData, TVars>,
  'mutation'
>;

type UpdateBuildVars = { id: string; payload: UpdateBuildPayload };

export type AlreadyKeptStatus = 'pending' | 'ready' | 'failed';

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

/**
 * Which local builds the account already holds under the same name with the same document.
 *
 * The list carries no documents, so only the cloud builds whose name a local build shares are
 * read in full — none at all in the usual case, and never more than the account's twenty.
 */
export function useAlreadyKept(
  localBuilds: Ref<readonly LocalBuild[]>,
  enabled: () => boolean
) {
  const { isSignedIn } = storeToRefs(useAuthStore());
  const list = useFetchBuilds();

  const nameMatchedIds = computed(() => {
    const localNames = new Set(
      localBuilds.value.map((localBuild) => localBuild.name.trim())
    );

    return (list.data.value?.items ?? [])
      .filter((summary) => localNames.has(summary.name))
      .map((summary) => summary.id)
      .sort();
  });

  const nameMatches = useAppQuery<CloudBuild[]>({
    key: () => [...buildsQueryKeys.fetchNameMatches, ...nameMatchedIds.value],
    query: () => Promise.all(nameMatchedIds.value.map((id) => fetchBuild(id))),
    enabled: () =>
      isSignedIn.value &&
      enabled() &&
      list.status.value === 'success' &&
      nameMatchedIds.value.length > 0
  });

  const status = computed<AlreadyKeptStatus>(() => {
    if (list.status.value === 'error' || nameMatches.status.value === 'error') {
      return 'failed';
    }

    if (list.status.value !== 'success' || list.isPlaceholderData.value) {
      return 'pending';
    }

    if (nameMatchedIds.value.length === 0) {
      return 'ready';
    }

    return nameMatches.status.value === 'success' &&
      !nameMatches.isPlaceholderData.value
      ? 'ready'
      : 'pending';
  });

  const alreadyKeptIds = computed(() => {
    const cloudBuilds =
      status.value === 'ready' ? (nameMatches.data.value ?? []) : [];

    return new Set(
      localBuilds.value
        .filter((localBuild) =>
          cloudBuilds.some(
            (cloudBuild) =>
              cloudBuild.name === localBuild.name.trim() &&
              isSameBuildDocument(cloudBuild.data, localBuild.data)
          )
        )
        .map((localBuild) => localBuild.id)
    );
  });

  return { alreadyKeptIds, status };
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
  options: MutationOptions<CloudBuild, UpdateBuildVars> = {}
) {
  const queryCache = useQueryCache();

  return useAppMutation<CloudBuild, UpdateBuildVars>({
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
  const authStore = useAuthStore();
  const { activeAccountBuildId } = storeToRefs(authStore);

  return useAppMutation<void, string>({
    mutation: (id) => deleteBuild(id),
    ...options,
    onSettled: chainOnSettled(async (_data, error, id) => {
      if (!error && activeAccountBuildId.value === id) {
        authStore.setActiveAccountBuildId(null);
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
