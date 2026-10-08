import { useFetchBuild } from '@/services/queries/useBuildQueries';

import type { SerializedBuild } from '@/types/build';

// * Keeps the open build in step with the account and the API (feature 029): the cached document behind a reload's first paint, the fetched build replacing it, the owner check, a vanished build, and what a sign-out does. Called once, from `app.vue`.
export function useOpenBuildSync() {
  const route = useRoute();
  const state = usePlannerState();
  const auth = useAuthStore();
  const { status, user, isSignOutChosen } = storeToRefs(auth);

  const {
    openCloudId,
    openCloudEntry,
    lastLocalId,
    requestedCloudId,
    openLocal,
    closeBuild,
    closeDeletedBuild,
    cacheCloudDocument
  } = useOpenBuild();
  const { localBuilds } = useLocalBuilds();
  const { isViewingSharedBuild, loadAccountBuild } = useBuildMode();
  const {
    hasUnsavedChanges,
    savedSnapshot,
    updateSavedSnapshot,
    forgetSavedSnapshot
  } = useUnsavedChanges();
  const { isSetAside, replaceSetAside } = usePlannerSetAside();

  // * True from boot until the remembered cloud build first answers: a `404` then means "fall back", not "deleted while open".
  let isRestoring = !!openCloudId.value;

  // ! Never fetched on a share page: the central policy turns any `404` there into the page's own not-found.
  const { data: fetched, error } = useFetchBuild(openCloudId, {
    enabled: () =>
      auth.isSignedIn && !!openCloudId.value && !route.path.startsWith('/b/')
  });

  // * The planner is someone else's build here — a snapshot, or a share page's — so a fetch must not land on it.
  const isPlannerBorrowed = computed(
    () => isViewingSharedBuild.value || isSetAside.value
  );

  // * Every load and save of the open cloud build moves the saved baseline, so the cache follows it. A newly opened build counts too: a create can leave the baseline's text unchanged.
  // ! Not while a build picked from the menu is still loading: the baseline then is the previous build's.
  watch([savedSnapshot, openCloudId], ([snapshot, id]) => {
    if (id && snapshot && !isSetAside.value && requestedCloudId.value !== id) {
      cacheCloudDocument(JSON.parse(snapshot) as SerializedBuild);
    }
  });

  watch(fetched, async (cloudBuild) => {
    // * The query keeps the previous build's data across an id change; only the open one's counts.
    if (!cloudBuild || cloudBuild.id !== openCloudId.value) {
      return;
    }

    isRestoring = false;

    const requested = requestedCloudId.value === cloudBuild.id;

    // * Picked from the menu, the user already agreed to replace the planner. Otherwise this is a background read: it replaces the planner only while nothing there is unsaved, and the next Save meets the conflict dialog (feature 008).
    if (!requested && (hasUnsavedChanges.value || isPlannerBorrowed.value)) {
      return;
    }

    requestedCloudId.value = null;
    await loadAccountBuild(cloudBuild.data);
    updateSavedSnapshot();
  });

  watch(error, (failure) => {
    if ((failure as { statusCode?: number } | null)?.statusCode !== 404) {
      return;
    }

    // * Gone before this visit could open it: the last local build stands in.
    if (isRestoring) {
      isRestoring = false;
      void fallBackToLocal();

      return;
    }

    // * Deleted on another device while open here: nothing is open, and the planner stays as it was, as unsaved work.
    closeDeletedBuild(DEFAULT_BUILD_NAME);
    forgetSavedSnapshot();
  });

  // * Immediate: the plugin may resolve the account before the shell installs this.
  watch(
    status,
    (next) => {
      const entry = openCloudEntry.value;

      if (!entry) {
        return;
      }

      // * Another account's build, cached in this browser: not this user's to see.
      if (next === 'signed-in' && entry.uid && entry.uid !== user.value?.uid) {
        isRestoring = false;
        void fallBackToLocal();

        return;
      }

      if (next !== 'anonymous') {
        return;
      }

      // * Signed out before the build first answered, or by choice. A session that ended on its own keeps the build and its edits on screen until the user signs back in.
      if (isRestoring || isSignOutChosen.value) {
        isRestoring = false;
        void fallBackToLocal();
      }
    },
    { immediate: true }
  );

  // * The last local build open here, or none with a blank planner. The cloud entry, cached document included, goes with it.
  async function fallBackToLocal() {
    const local = localBuilds.value.find(
      (localBuild) => localBuild.id === lastLocalId.value
    );

    if (local) {
      openLocal(local.id);
    } else {
      closeBuild();
    }

    const document: SerializedBuild = local?.data ?? { v: 1 };

    if (isSetAside.value) {
      replaceSetAside(document);

      return;
    }

    // * A snapshot on screen stays there; only what Back to my build returns to changes.
    if (isViewingSharedBuild.value) {
      return;
    }

    await deserializeBuild(document, state);
    updateSavedSnapshot();
  }
}
