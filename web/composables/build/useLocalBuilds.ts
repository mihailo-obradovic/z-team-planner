import type { LocalBuild } from '@/types/build';

const STORAGE_KEY_BUILDS = 'z-team-builds';

export function useLocalBuilds() {
  const state = usePlannerState();
  const { leaveSharedMode } = useBuildMode();
  const { clearUrlParam } = useBuildSharing();
  const { updateSavedSnapshot } = useUnsavedChanges();
  const { openLocalId, openLocal, closeBuild } = useOpenBuild();

  const localBuilds = useLocalStorageRef<LocalBuild[]>(STORAGE_KEY_BUILDS, []);

  const activeBuildName = computed(
    () => findLocalBuild(openLocalId.value)?.name ?? 'Untitled'
  );

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

  function saveLocalBuild(name?: string) {
    const existing = getActiveBuild();

    if (!existing) {
      saveAsNewLocalBuild(name ?? `Build ${localBuilds.value.length + 1}`);

      return;
    }

    existing.data = serializeBuild(state);

    if (name !== undefined) {
      existing.name = name;
    }

    settleOnOwnBuild();
  }

  function saveAsNewLocalBuild(name: string) {
    const localBuild: LocalBuild = {
      id: crypto.randomUUID(),
      name,
      data: serializeBuild(state)
    };

    localBuilds.value.push(localBuild);
    openLocal(localBuild.id);

    settleOnOwnBuild();
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

    localBuilds.value.splice(index, 1);

    if (openLocalId.value === id) {
      const next = localBuilds.value[0];

      if (next) {
        openLocal(next.id);
      } else {
        closeBuild();
      }
    }
  }

  function renameLocalBuild(id: string, name: string) {
    const localBuild = findLocalBuild(id);

    if (localBuild) {
      localBuild.name = name;
    }
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
