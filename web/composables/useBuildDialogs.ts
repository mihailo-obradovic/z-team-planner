import { BuildSchema, type Build } from '@/types/api';

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

  // * The 412 conflict: another device saved the same account build first. The server sends
  // * its current version back in the body, and the user chooses which one wins (feature 006).
  const conflictOpen = useState('build-dialog-conflict', () => false);
  const conflictBuild = useState<Build | null>(
    'build-dialog-conflict-build',
    () => null
  );

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

  /**
   * Open the conflict dialog with the server's current build.
   *
   * A body that will not parse is not a conflict this dialog can present — without the other
   * device's build there is nothing to choose between — so it falls through to the generic
   * toast instead (feature 006, Edge Cases).
   */
  function openConflict(payload: unknown): boolean {
    const parsed = BuildSchema.safeParse(payload);

    if (!parsed.success) {
      return false;
    }

    conflictBuild.value = parsed.data;
    conflictOpen.value = true;

    return true;
  }

  return {
    saveSharedOpen,
    conflictOpen,
    conflictBuild,
    openConflict,
    newBuildOpen,
    deleteOpen,
    renameOpen,
    newBuildName,
    renameBuildName,
    openNewBuild,
    openRename
  };
}
