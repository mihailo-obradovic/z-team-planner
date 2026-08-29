import type { LocalBuild } from '@/types/build';

const STORAGE_KEY_BUILDS = 'z-team-builds';
const STORAGE_KEY_ACTIVE = 'z-team-active-build';

export function useLocalBuilds() {
  const state = usePlannerState();
  const { leaveSharedMode } = useBuildMode();
  const { clearUrlParam } = useBuildSharing();
  const { updateSavedSnapshot } = useUnsavedChanges();

  const localBuilds = useLocalStorageRef<LocalBuild[]>(STORAGE_KEY_BUILDS, []);
  const activeBuildId = useLocalStorageRef<string | null>(
    STORAGE_KEY_ACTIVE,
    null
  );

  const activeBuildName = computed(
    () => findBuild(activeBuildId.value)?.name ?? 'Untitled'
  );

  function settleOnOwnBuild() {
    leaveSharedMode();
    clearUrlParam();
    updateSavedSnapshot();
  }

  function findBuild(id: string | null): LocalBuild | undefined {
    if (!id) {
      return undefined;
    }

    return localBuilds.value.find((build) => build.id === id);
  }

  function getActiveBuild(): LocalBuild | undefined {
    return findBuild(activeBuildId.value);
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
    const build: LocalBuild = {
      id: crypto.randomUUID(),
      name,
      data: serializeBuild(state)
    };

    localBuilds.value.push(build);
    activeBuildId.value = build.id;

    settleOnOwnBuild();
  }

  async function loadLocalBuild(id: string) {
    const build = findBuild(id);

    if (!build) {
      return;
    }

    activeBuildId.value = id;

    await deserializeBuild(build.data, state);
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
    const index = localBuilds.value.findIndex((build) => build.id === id);

    if (index === -1) {
      return;
    }

    localBuilds.value.splice(index, 1);

    if (activeBuildId.value === id) {
      activeBuildId.value = localBuilds.value[0]?.id ?? null;
    }
  }

  function renameLocalBuild(id: string, name: string) {
    const build = findBuild(id);

    if (build) {
      build.name = name;
    }
  }

  return {
    localBuilds: computed(() => localBuilds.value),
    activeBuildId: computed(() => activeBuildId.value),
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
