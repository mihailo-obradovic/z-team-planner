import type { LocalBuild } from '@/types/build';
import type { PlannerState } from '@/composables/usePlannerState';

const STORAGE_KEY_BUILDS = 'z-team-builds';
const STORAGE_KEY_ACTIVE = 'z-team-active-build';

// * The local builds — named build documents saved in this browser (`catalyst/context/glossary.md`).
// * Storage only. Leaving shared-build mode, clearing the URL parameter and re-baselining the dirty snapshot belong to the callers that orchestrate a save, not here.
export function useLocalBuilds(state: PlannerState) {
  const localBuilds = useLocalStorageRef<LocalBuild[]>(STORAGE_KEY_BUILDS, []);
  const activeBuildId = useLocalStorageRef<string | null>(
    STORAGE_KEY_ACTIVE,
    null
  );

  const activeBuildName = computed(
    () => findBuild(activeBuildId.value)?.name ?? 'Untitled'
  );

  function findBuild(id: string | null): LocalBuild | undefined {
    if (!id) {
      return undefined;
    }

    return localBuilds.value.find((build) => build.id === id);
  }

  function getActiveBuild(): LocalBuild | undefined {
    return findBuild(activeBuildId.value);
  }

  // * Overwrite the active build, or create the first one if there is none.
  function saveActiveBuild(name?: string) {
    const data = serializeBuild(state);
    const existing = getActiveBuild();

    if (!existing) {
      appendBuild(name ?? `Build ${localBuilds.value.length + 1}`);

      return;
    }

    existing.data = data;

    if (name !== undefined) {
      existing.name = name;
    }
  }

  function appendBuild(name: string) {
    const build: LocalBuild = {
      id: crypto.randomUUID(),
      name,
      data: serializeBuild(state)
    };

    localBuilds.value.push(build);
    activeBuildId.value = build.id;
  }

  function removeBuild(id: string) {
    const index = localBuilds.value.findIndex((build) => build.id === id);

    if (index === -1) {
      return;
    }

    localBuilds.value.splice(index, 1);

    if (activeBuildId.value === id) {
      activeBuildId.value = localBuilds.value[0]?.id ?? null;
    }
  }

  function renameBuild(id: string, name: string) {
    const build = findBuild(id);

    if (build) {
      build.name = name;
    }
  }

  return {
    localBuilds,
    activeBuildId,
    activeBuildName,
    findBuild,
    getActiveBuild,
    saveActiveBuild,
    appendBuild,
    removeBuild,
    renameBuild
  };
}
