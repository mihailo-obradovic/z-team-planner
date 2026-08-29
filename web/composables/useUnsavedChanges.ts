import type { SerializedBuild } from '@/types/build';

// * Whether the planner holds changes the user would lose.
// * Dirtiness is defined by what a save would write, not by which refs were touched: the comparison is against the serialised document, so an allocation raised and lowered again reads as clean.
export function useUnsavedChanges() {
  const state = usePlannerState();
  const { isViewingSharedBuild } = useBuildMode();
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

  // * A document is passed when the baseline is not the planner's state right now: an async save
  // * settles against what it sent, so an edit made while the request was in flight stays dirty.
  // ! Only ever the output of `serializeBuild`. A document straight off the wire is the wrong
  // ! baseline — deserialising then reserialising normalises it (an all-zero `lu` entry is
  // ! dropped), so the planner would read as dirty the instant it finished loading.
  function updateSavedSnapshot(document?: SerializedBuild) {
    savedSnapshot.value = document ? JSON.stringify(document) : takeSnapshot();
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
