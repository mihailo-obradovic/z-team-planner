import type { LocalBuild } from '@/types/build';

const STORAGE_KEY_BUILDS = 'z-team-builds';

export function useLocalBuilds() {
  const state = usePlannerState();
  const { leaveSharedMode } = useBuildMode();
  const { clearUrlParam } = useBuildSharing();
  const { updateSavedSnapshot, forgetSavedSnapshot } = useUnsavedChanges();
  const { openLocalId, openLocal, closeDeletedBuild, draftName } =
    useOpenBuild();

  const localBuilds = useLocalStorageRef<LocalBuild[]>(STORAGE_KEY_BUILDS, []);

  const activeBuildName = computed(
    () => findLocalBuild(openLocalId.value)?.name ?? draftName.value
  );

  // * The names a build may not take; `exceptId` leaves a renamed build's own name free.
  function takenNames(exceptId?: string) {
    return localBuilds.value
      .filter((localBuild) => localBuild.id !== exceptId)
      .map((localBuild) => localBuild.name);
  }

  function settleOnOwnBuild() {
    leaveSharedMode();
    clearUrlParam();
    updateSavedSnapshot();
  }

  function findLocalBuild(id: string | null): LocalBuild | undefined {
    if (!id) {
      return undefined;
    }

    return localBuilds.value.find((localBuild) => localBuild.id === id);
  }

  function getActiveBuild(): LocalBuild | undefined {
    return findLocalBuild(openLocalId.value);
  }

  // * Returns the name the build ended up with.
  function saveLocalBuild(): string {
    const existing = getActiveBuild();

    if (!existing) {
      return saveAsNewLocalBuild(DEFAULT_BUILD_NAME);
    }

    existing.data = serializeBuild(state);
    settleOnOwnBuild();

    return existing.name;
  }

  // * Returns the final name, suffix included, for the confirmation to report.
  function saveAsNewLocalBuild(name: string): string {
    const localBuild: LocalBuild = {
      id: crypto.randomUUID(),
      name: freeBuildName(takenNames(), name),
      data: serializeBuild(state)
    };

    localBuilds.value.push(localBuild);
    openLocal(localBuild.id);

    settleOnOwnBuild();

    return localBuild.name;
  }

  async function loadLocalBuild(id: string) {
    const localBuild = findLocalBuild(id);

    if (!localBuild) {
      return;
    }

    openLocal(id);

    await deserializeBuild(localBuild.data, state);
    settleOnOwnBuild();
  }

  async function backToMyBuild() {
    const active = getActiveBuild();

    if (active) {
      await deserializeBuild(active.data, state);
    }

    settleOnOwnBuild();
  }

  function deleteLocalBuild(id: string) {
    const index = localBuilds.value.findIndex(
      (localBuild) => localBuild.id === id
    );

    if (index === -1) {
      return;
    }

    const [deleted] = localBuilds.value.splice(index, 1);

    if (openLocalId.value === id) {
      closeDeletedBuild(deleted!.name);
      forgetSavedSnapshot();
    }
  }

  // * Returns the final name, or undefined when there is no such build.
  function renameLocalBuild(id: string, name: string): string | undefined {
    const localBuild = findLocalBuild(id);

    if (!localBuild) {
      return undefined;
    }

    localBuild.name = freeBuildName(takenNames(id), name);

    return localBuild.name;
  }

  return {
    localBuilds: computed(() => localBuilds.value),
    activeBuildId: openLocalId,
    activeBuildName,
    getActiveBuild,
    saveLocalBuild,
    saveAsNewLocalBuild,
    loadLocalBuild,
    backToMyBuild,
    deleteLocalBuild,
    renameLocalBuild
  };
}
