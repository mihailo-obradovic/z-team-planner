import type { SerializedBuild } from '@/types/build';

// ! Depends on nothing but `usePlannerState`. `useLocalBuilds` calls this one, so a call back into it would be a cycle that recurses until the stack runs out.
export function useBuildMode() {
  const state = usePlannerState();
  const isViewingSharedBuild = useState<boolean>(
    'isViewingSharedBuild',
    () => false
  );

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
    loadAccountBuild
  };
}
