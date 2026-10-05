import { CloudBuildSchema, type CloudBuild } from '@/types/api';

import type { HeaderTier } from '@/types/header';

// ! A dialog raised from a menu item has no opener left to return focus to — the item unmounts with the menu — so the menu's trigger is remembered here and focused on close instead. Module state, not `useState`: an element is client-only and never serialized.
const dialogOpener = shallowRef<HTMLElement | null>(null);

// * Called from a menu item's `onSelect`, while the menu is still open: the one expanded menu trigger is the opener, whichever header tier it sits in.
function rememberOpener() {
  dialogOpener.value = document.querySelector<HTMLElement>(
    '[aria-haspopup="menu"][aria-expanded="true"]'
  );
}

function restoreOpenerFocus(event: Event) {
  const opener = dialogOpener.value;

  if (!opener) {
    return;
  }

  event.preventDefault();
  opener.focus();
  dialogOpener.value = null;
}

// * Passed as `u-modal`'s `content` by every dialog a menu can raise; reka emits `closeAutoFocus` right before it would focus the element that was active on open.
const dialogContent = { onCloseAutoFocus: restoreOpenerFocus };

// * Every overlay whose openers sit outside it: the build dialogs, and the delete-account dialog the profile menu raises from any header tier. A dialog with one nearby opener keeps its own `defineModel('open')` instead.
export function useDialogs() {
  const buildMenuTier = useState<HeaderTier | null>(
    'build-menu-open-tier',
    () => null
  );

  const saveSharedOpen = useState('build-dialog-save-shared', () => false);
  const newBuildOpen = useState('build-dialog-new', () => false);
  const deleteOpen = useState('build-dialog-delete', () => false);
  const renameOpen = useState('build-dialog-rename', () => false);

  const accountSaveOpen = useState('build-dialog-account-save', () => false);
  const accountSaveName = useState('build-dialog-account-save-name', () => '');
  const accountDeleteOpen = useState(
    'build-dialog-account-delete',
    () => false
  );

  const deleteAccountOpen = useState('account-dialog-delete', () => false);

  const conflictOpen = useState('build-dialog-conflict', () => false);
  const conflictBuild = useState<CloudBuild | null>(
    'build-dialog-conflict-build',
    () => null
  );

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
    dialogContent,
    rememberOpener,
    buildMenuTier,
    openBuildMenu,
    saveSharedOpen,
    accountSaveOpen,
    accountSaveName,
    accountDeleteOpen,
    openAccountSave,
    deleteAccountOpen,
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
