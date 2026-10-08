import type { PlannerSetAside, SerializedBuild } from '@/types/build';

export function useUnsavedChanges() {
  const state = usePlannerState();
  const { isViewingSharedBuild } = useBuildMode();
  const savedSnapshot = useState<string>('savedSnapshot', () => '');

  // * Read by key, not through `usePlannerSetAside`, which calls this composable.
  const setAside = useState<PlannerSetAside | null>(
    PLANNER_SET_ASIDE_KEY,
    () => null
  );

  const hasUnsavedChanges = computed(() => {
    // * On a share page the planner shows someone else's build; what is at stake is the visitor's own, set aside.
    if (setAside.value) {
      return setAside.value.wasDirty;
    }

    // * Someone else's build has nothing of the user's in it to lose.
    if (isViewingSharedBuild.value) {
      return false;
    }

    return takeSnapshot() !== savedSnapshot.value;
  });

  function takeSnapshot(): string {
    return JSON.stringify(serializeBuild(state));
  }

  function updateSavedSnapshot(document?: SerializedBuild) {
    savedSnapshot.value = document ? JSON.stringify(document) : takeSnapshot();
  }

  // * Nothing saved stands behind the planner any more — its build was deleted — so all of it is unsaved work.
  function forgetSavedSnapshot() {
    savedSnapshot.value = '';
  }

  function setupBeforeUnload() {
    if (import.meta.server) {
      return;
    }

    window.addEventListener('beforeunload', (event) => {
      if (hasUnsavedChanges.value) {
        event.preventDefault();
      }
    });
  }

  return {
    hasUnsavedChanges,
    savedSnapshot,
    updateSavedSnapshot,
    forgetSavedSnapshot,
    setupBeforeUnload
  };
}
