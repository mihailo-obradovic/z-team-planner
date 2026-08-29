import type { SerializedBuild } from '@/types/build';

// * The planner's persistence surface, composed from the concerns below it.
// * A facade on purpose: `useHeroPlanner` spreads this and six components destructure the result, so the split underneath is invisible to all of them (decision 006).
// * What lives here is orchestration — the sequences that touch more than one concern. Storage is `useLocalBuilds`, the share link is `useBuildSharing`, dirty tracking is `useUnsavedChanges`, and the document format is `utils/buildDocument.ts`.
export function useBuildPersistence() {
  const state = usePlannerState();
  const builds = useLocalBuilds(state);
  const sharing = useBuildSharing(state);
  const unsaved = useUnsavedChanges(state);

  const isViewingSharedBuild = useState<boolean>(
    'isViewingSharedBuild',
    () => false
  );

  // * Every path that puts the user back on a build of their own ends the same way: leave shared mode, drop the share parameter, re-baseline the dirty snapshot.
  function settleOnOwnBuild() {
    isViewingSharedBuild.value = false;
    sharing.clearUrlParam();
    unsaved.updateSavedSnapshot();
  }

  function saveLocalBuild(name?: string) {
    builds.saveActiveBuild(name);
    settleOnOwnBuild();
  }

  function saveAsNewLocalBuild(name: string) {
    builds.appendBuild(name);
    settleOnOwnBuild();
  }

  async function loadLocalBuild(id: string) {
    const build = builds.findBuild(id);

    if (!build) {
      return;
    }

    builds.activeBuildId.value = id;

    await deserializeBuild(build.data, state);
    settleOnOwnBuild();
  }

  // * A build document fetched from the API, opened read-only (feature 007).
  async function loadSharedBuild(build: SerializedBuild) {
    isViewingSharedBuild.value = true;

    await deserializeBuild(build, state);
  }

  // * The owner opening their own cloud build (feature 008) — the same deserialisation, but not shared-build mode, so the read-only banner stays away.
  async function loadAccountBuild(build: SerializedBuild) {
    isViewingSharedBuild.value = false;

    await deserializeBuild(build, state);
  }

  async function backToMyBuild() {
    const active = builds.getActiveBuild();

    if (active) {
      await deserializeBuild(active.data, state);
    }

    settleOnOwnBuild();
  }

  async function initialize() {
    if (import.meta.server) {
      return;
    }

    const route = useRoute();
    const param = route.query[BUILD_URL_PARAM] as string | undefined;
    const shared = sharing.readSharedBuildFromUrl(param);

    if (shared) {
      isViewingSharedBuild.value = true;

      await deserializeBuild(shared, state);
    } else {
      // * No parameter, or one that would not decode. Strip the dead value so a reload cannot re-trip on it, then fall back to the active local build.
      if (param) {
        sharing.clearUrlParam();
      }

      const active = builds.getActiveBuild();

      if (active) {
        await deserializeBuild(active.data, state);
      }
    }

    unsaved.updateSavedSnapshot();
  }

  return {
    // * State
    localBuilds: computed(() => builds.localBuilds.value),
    activeBuildId: computed(() => builds.activeBuildId.value),
    activeBuildName: builds.activeBuildName,
    isViewingSharedBuild: computed(() => isViewingSharedBuild.value),
    hasUnsavedChanges: unsaved.hasUnsavedChanges,

    // * Local builds — the glossary's term, and what keeps `deleteLocalBuild` here distinct from `useDeleteBuild` in the query layer.
    serializeCurrentBuild: () => serializeBuild(state),
    saveLocalBuild,
    saveAsNewLocalBuild,
    loadLocalBuild,
    deleteLocalBuild: builds.removeBuild,
    renameLocalBuild: builds.renameBuild,

    // * Sharing
    shareBuild: sharing.shareBuild,
    getShareUrl: sharing.getShareUrl,

    // * Cloud and shared builds
    loadSharedBuild,
    loadAccountBuild,
    backToMyBuild,

    // * Lifecycle
    initialize,
    setupBeforeUnload: unsaved.setupBeforeUnload
  };
}
