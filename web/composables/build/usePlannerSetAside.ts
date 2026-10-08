import type { PlannerSetAside, SerializedBuild } from '@/types/build';

export const PLANNER_SET_ASIDE_KEY = 'planner-set-aside';

// * The share page shows its build in the planner's own state, so it sets the visitor's planner aside on entry and puts it back on leave, unsaved edits included (feature 029). It never enters shared-build mode.
export function usePlannerSetAside() {
  const state = usePlannerState();
  const { hasUnsavedChanges, savedSnapshot } = useUnsavedChanges();
  const setAside = useState<PlannerSetAside | null>(
    PLANNER_SET_ASIDE_KEY,
    () => null
  );

  // * Once per visit: a second share link opened from the first keeps the visitor's planner, not the first link's build.
  function setPlannerAside() {
    if (setAside.value) {
      return;
    }

    setAside.value = {
      document: serializeBuild(state),
      savedSnapshot: savedSnapshot.value,
      wasDirty: hasUnsavedChanges.value
    };
  }

  async function restorePlanner() {
    const held = setAside.value;

    if (!held) {
      return;
    }

    await deserializeBuild(held.document, state);
    savedSnapshot.value = held.savedSnapshot;
    setAside.value = null;
  }

  // * The visitor's own build changed while it was set aside — a sign-out fell back to another — so that is what the leave restores.
  function replaceSetAside(document: SerializedBuild) {
    if (!setAside.value) {
      return;
    }

    setAside.value = {
      document,
      savedSnapshot: JSON.stringify(document),
      wasDirty: false
    };
  }

  // * After a copy: the planner now holds the copy, which is open, so there is nothing to put back.
  function dropSetAside() {
    setAside.value = null;
  }

  return {
    isSetAside: computed(() => !!setAside.value),
    setPlannerAside,
    restorePlanner,
    replaceSetAside,
    dropSetAside
  };
}
