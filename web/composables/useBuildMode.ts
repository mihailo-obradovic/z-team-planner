import type { SerializedBuild } from '@/types/build';

// ! Depends on nothing but `usePlannerState`. `useLocalBuilds` and `useUnsavedChanges` both call this one, so a call back into either would be a cycle that recurses until the stack runs out.
export function useBuildMode() {
  const state = usePlannerState();
  const isViewingSharedBuild = useState<boolean>(
    'isViewingSharedBuild',
    () => false
  );

  async function loadSharedBuild(build: SerializedBuild) {
    isViewingSharedBuild.value = true;

    await deserializeBuild(build, state);
  }

  async function loadAccountBuild(build: SerializedBuild) {
    isViewingSharedBuild.value = false;

    await deserializeBuild(build, state);
  }

  return {
    isViewingSharedBuild: computed(() => isViewingSharedBuild.value),
    enterSharedMode: () => {
      isViewingSharedBuild.value = true;
    },
    leaveSharedMode: () => {
      isViewingSharedBuild.value = false;
    },
    loadSharedBuild,
    loadAccountBuild
  };
}
