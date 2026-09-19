import type { SerializedBuild } from '@/types/build';

// ! Depends on nothing but `usePlannerState`. `useLocalBuilds` and `useUnsavedChanges` both call this one, so a call back into either would be a cycle that recurses until the stack runs out.
export function useBuildMode() {
  const state = usePlannerState();
  const isViewingSharedBuild = useState<boolean>(
    'isViewingSharedBuild',
    () => false
  );

  async function loadSharedBuild(buildDocument: SerializedBuild) {
    isViewingSharedBuild.value = true;

    await deserializeBuild(buildDocument, state);
  }

  async function loadAccountBuild(buildDocument: SerializedBuild) {
    isViewingSharedBuild.value = false;

    await deserializeBuild(buildDocument, state);
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
