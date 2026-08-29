import type { PlannerState } from '@/composables/usePlannerState';

// * Whether the planner holds changes the user would lose.
// * Dirtiness is defined by what a save would write, not by which refs were touched: the comparison is against the serialised document, so an allocation raised and lowered again reads as clean.
export function useUnsavedChanges(state: PlannerState) {
  const isViewingSharedBuild = useState<boolean>(
    'isViewingSharedBuild',
    () => false
  );
  const savedSnapshot = useState<string>('savedSnapshot', () => '');

  const hasUnsavedChanges = computed(() => {
    // * Someone else's build has nothing of the user's in it to lose.
    if (isViewingSharedBuild.value) {
      return false;
    }

    return takeSnapshot() !== savedSnapshot.value;
  });

  function takeSnapshot(): string {
    return JSON.stringify(serializeBuild(state));
  }

  function updateSavedSnapshot() {
    savedSnapshot.value = takeSnapshot();
  }

  // * `preventDefault` is what asks the browser for its own leave-site prompt; the wording is the browser's and cannot be set.
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

  return { hasUnsavedChanges, updateSavedSnapshot, setupBeforeUnload };
}
