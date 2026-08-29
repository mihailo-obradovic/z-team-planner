import { CloudBuildSchema, type CloudBuild } from '@/types/api';

import type { HeaderTier } from '@/types/ui';

// * Open state and draft names for the four build dialogs.
// * The controls that open these dialogs render in more than one place — the header at `md` and up, the mobile action bar below it — but the dialogs themselves must be mounted exactly once, or every open would raise a stack of identical modals. Splitting the state out is what lets `BuildDialogs` live at the shell while the buttons live wherever the tier ladder puts them.
export function useBuildDialogs() {
  // * Which tier's build selector is open, rather than a boolean: the selector is mounted once per header tier and its menu teleports to `body`, so a shared boolean would open every copy at once and stack three identical menus over each other.
  const buildMenuTier = useState<HeaderTier | null>(
    'build-menu-open-tier',
    () => null
  );

  const saveSharedOpen = useState('build-dialog-save-shared', () => false);
  const newBuildOpen = useState('build-dialog-new', () => false);
  const deleteOpen = useState('build-dialog-delete', () => false);
  const renameOpen = useState('build-dialog-rename', () => false);

  // * Saving the planner's current state to the account as a new build, and removing one.
  const accountSaveOpen = useState('build-dialog-account-save', () => false);
  const accountSaveName = useState('build-dialog-account-save-name', () => '');
  const accountDeleteOpen = useState(
    'build-dialog-account-delete',
    () => false
  );

  // * The 412 conflict: another device saved the same account build first. The server sends its current version back in the body, and the user chooses which one wins (feature 008).
  const conflictOpen = useState('build-dialog-conflict', () => false);
  const conflictBuild = useState<CloudBuild | null>(
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

  // * Open the conflict dialog with the server's current build.
  // * A body that will not parse is not a conflict this dialog can present — without the other device's build there is nothing to choose between — so it falls through to the generic toast instead (feature 008, Edge Cases).
  function openConflict(payload: unknown): boolean {
    const parsed = CloudBuildSchema.safeParse(payload);

    if (!parsed.success) {
      return false;
    }

    conflictBuild.value = parsed.data;
    conflictOpen.value = true;

    return true;
  }

  function openBuildMenu(tier: HeaderTier) {
    buildMenuTier.value = tier;
  }

  function openAccountSave(name = '') {
    accountSaveName.value = name;
    accountSaveOpen.value = true;
  }

  return {
    buildMenuTier,
    openBuildMenu,
    saveSharedOpen,
    accountSaveOpen,
    accountSaveName,
    accountDeleteOpen,
    openAccountSave,
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
