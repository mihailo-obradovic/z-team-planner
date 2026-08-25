/**
 * Open state and draft names for the four build dialogs.
 *
 * The controls that open these dialogs render in more than one place — the
 * header at `md` and up, the mobile action bar below it — but the dialogs
 * themselves must be mounted exactly once, or every open would raise a stack
 * of identical modals. Splitting the state out is what lets `BuildDialogs`
 * live at the shell while the buttons live wherever the tier ladder puts them.
 */
export function useBuildDialogs() {
  const saveSharedOpen = useState('build-dialog-save-shared', () => false);
  const newBuildOpen = useState('build-dialog-new', () => false);
  const deleteOpen = useState('build-dialog-delete', () => false);
  const renameOpen = useState('build-dialog-rename', () => false);

  // * Drafts, not committed values: each dialog writes through to the store only on confirm.
  const newBuildName = useState('build-dialog-new-name', () => '');
  const renameBuildName = useState('build-dialog-rename-name', () => '');

  function openNewBuild(name = '') {
    newBuildName.value = name;
    newBuildOpen.value = true;
  }

  function openRename(currentName: string) {
    renameBuildName.value = currentName;
    renameOpen.value = true;
  }

  return {
    saveSharedOpen,
    newBuildOpen,
    deleteOpen,
    renameOpen,
    newBuildName,
    renameBuildName,
    openNewBuild,
    openRename
  };
}
