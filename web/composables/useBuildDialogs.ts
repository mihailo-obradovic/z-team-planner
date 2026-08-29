import { CloudBuildSchema, type CloudBuild } from '@/types/api';

import type { HeaderTier } from '@/types/ui';

export function useBuildDialogs() {
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
