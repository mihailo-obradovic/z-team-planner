// * The action waiting on the discard confirmation. Module state, not `useState`: a function is client-only and never serialized.
const pendingAction = shallowRef<(() => unknown) | null>(null);

// * Every action that replaces the planner runs through this (feature 029, Protecting work): straight away when nothing is unsaved, otherwise only once the discard confirmation says so.
export function useDiscardGuard() {
  const { hasUnsavedChanges } = useUnsavedChanges();
  const { rememberOpener } = useDialogs();
  const discardOpen = useState('build-dialog-discard', () => false);

  function guardDiscard(action: () => unknown) {
    if (!hasUnsavedChanges.value) {
      action();

      return;
    }

    // * Raised from a menu item, focus goes back to the menu's trigger; from a button, the dialog's own return applies.
    rememberOpener();
    pendingAction.value = action;
    discardOpen.value = true;
  }

  function confirmDiscard() {
    const action = pendingAction.value;

    closeDiscard();
    action?.();
  }

  // * Cancel, Escape and a click outside all land here, and leave everything as it was.
  function closeDiscard() {
    pendingAction.value = null;
    discardOpen.value = false;
  }

  return {
    discardOpen: readonly(discardOpen),
    guardDiscard,
    confirmDiscard,
    closeDiscard
  };
}
