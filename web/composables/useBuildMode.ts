import type { SerializedBuild } from '@/types/build';

// * Which build the planner is showing, and how it got there.
// * Owns `isViewingSharedBuild` — the flag that decides whether the planner is holding something of the user's or someone else's. Everything downstream reads it from here.
// ! Depends on nothing but `usePlannerState`. `useLocalBuilds` and `useUnsavedChanges` both call this one, so a call back into either would be a cycle that recurses until the stack runs out.
export function useBuildMode() {
  const state = usePlannerState();
  const isViewingSharedBuild = useState<boolean>(
    'isViewingSharedBuild',
    () => false
  );

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
