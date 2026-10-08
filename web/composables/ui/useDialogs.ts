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

  const saveAsNewOpen = useState('build-dialog-save-as-new', () => false);
  const deleteOpen = useState('build-dialog-delete', () => false);
  const renameOpen = useState('build-dialog-rename', () => false);

  const accountSaveOpen = useState('build-dialog-account-save', () => false);
  const accountSaveName = useState('build-dialog-account-save-name', () => '');
  const deleteAccountOpen = useState('account-dialog-delete', () => false);

  const conflictOpen = useState('build-dialog-conflict', () => false);
  const conflictBuild = useState<CloudBuild | null>(
    'build-dialog-conflict-build',
    () => null
  );

  const saveAsNewName = useState('build-dialog-save-as-new-name', () => '');
  const renameBuildName = useState('build-dialog-rename-name', () => '');

  // * The local half of Save as new; signed in, the account save dialog takes its place (feature 029).
  function openSaveAsNew(name = '') {
    saveAsNewName.value = name;
    saveAsNewOpen.value = true;
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
    accountSaveOpen,
    accountSaveName,
    openAccountSave,
    deleteAccountOpen,
    conflictOpen,
    conflictBuild,
    openConflict,
    saveAsNewOpen,
    deleteOpen,
    renameOpen,
    saveAsNewName,
    renameBuildName,
    openSaveAsNew,
    openRename
  };
}
