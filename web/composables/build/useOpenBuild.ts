export type OpenBuild = { kind: 'local' | 'cloud'; id: string };

type OpenBuildRecord = {
  open: OpenBuild | null;
  // * The local build to fall back to when a cloud build closes (feature 029).
  lastLocalId: string | null;
};

const STORAGE_KEY = 'z-team-open-build';

// * The one build the planner is on, of either kind, or none (feature 029). Every "which build" question — the header's name, the tick in the menu, Save, Rename, Delete — reads this and nothing else.
// ! Depends on nothing but storage: `useLocalBuilds`, the build queries and the auth flow all call it.
export function useOpenBuild() {
  const record = useLocalStorageRef<OpenBuildRecord>(STORAGE_KEY, {
    open: null,
    lastLocalId: null
  });

  // * The name Save offers while nothing is open: a just-deleted build's, now free, else the default. Session-only — a reload offers the default.
  const draftName = useState<string>(
    'open-build-draft-name',
    () => DEFAULT_BUILD_NAME
  );

  const openBuild = computed(() => record.value.open);

  const openLocalId = computed(() =>
    record.value.open?.kind === 'local' ? record.value.open.id : null
  );

  const openCloudId = computed(() =>
    record.value.open?.kind === 'cloud' ? record.value.open.id : null
  );

  function openLocal(id: string) {
    draftName.value = DEFAULT_BUILD_NAME;
    record.value = { open: { kind: 'local', id }, lastLocalId: id };
  }

  function openCloud(id: string) {
    draftName.value = DEFAULT_BUILD_NAME;
    record.value = { ...record.value, open: { kind: 'cloud', id } };
  }

  function closeBuild() {
    record.value = { ...record.value, open: null };
  }

  // * After a delete the planner keeps the deleted build's contents, unsaved, and Save offers its name back.
  function closeDeletedBuild(name: string) {
    closeBuild();
    draftName.value = name;
  }

  function closeCloudBuild() {
    if (openCloudId.value) {
      closeBuild();
    }
  }

  // * Called when sign-out has happened: a cloud build belongs to an account the planner no longer has.
  function watchSignOut() {
    const { status } = storeToRefs(useAuthStore());

    watch(status, (next) => {
      if (next === 'anonymous') {
        closeCloudBuild();
      }
    });
  }

  return {
    openBuild,
    openLocalId,
    openCloudId,
    lastLocalId: computed(() => record.value.lastLocalId),
    draftName: readonly(draftName),
    openLocal,
    openCloud,
    closeBuild,
    closeDeletedBuild,
    closeCloudBuild,
    watchSignOut
  };
}
