import type { SerializedBuild } from '@/types/build';

// * A cloud entry carries its last saved document and the uid that owns it, so a reload can paint the build before the API answers (feature 029). Nothing else from the account is kept.
export type OpenBuild =
  | { kind: 'local'; id: string }
  | {
      kind: 'cloud';
      id: string;
      uid: string | null;
      document: SerializedBuild | null;
    };

type OpenBuildRecord = {
  open: OpenBuild | null;
  // * The local build to fall back to when a cloud build closes (feature 029).
  lastLocalId: string | null;
};

const STORAGE_KEY = 'z-team-open-build';

const EMPTY_RECORD: OpenBuildRecord = { open: null, lastLocalId: null };

// * The one build the planner is on, of either kind, or none (feature 029). Every "which build" question — the header's name, the tick in the menu, Save, Rename, Delete — reads this and nothing else.
// ! Depends on nothing but storage and the auth store's uid: `useLocalBuilds`, the build queries and the auth flow all call it.
export function useOpenBuild() {
  const stored = useLocalStorageRef<OpenBuildRecord>(STORAGE_KEY, EMPTY_RECORD);

  // * A corrupt or foreign record reads as nothing open, never as an error (feature 029, Error Handling).
  const record = computed(() =>
    isOpenBuildRecord(stored.value) ? stored.value : EMPTY_RECORD
  );

  // * The name Save offers while nothing is open: a just-deleted build's, now free, else the default. Session-only — a reload offers the default.
  const draftName = useState<string>(
    'open-build-draft-name',
    () => DEFAULT_BUILD_NAME
  );

  // * A cloud build picked from the menu, waiting for its document: when it arrives it replaces the planner even over edits, because the discard confirmation already said so.
  const requestedCloudId = useState<string | null>(
    'open-build-requested-cloud-id',
    () => null
  );

  const openBuild = computed(() => record.value.open);

  const openLocalId = computed(() =>
    record.value.open?.kind === 'local' ? record.value.open.id : null
  );

  const openCloudId = computed(() =>
    record.value.open?.kind === 'cloud' ? record.value.open.id : null
  );

  // * The cached cloud entry, for the reload paint and the owner check.
  const openCloudEntry = computed(() =>
    record.value.open?.kind === 'cloud' ? record.value.open : null
  );

  function openLocal(id: string) {
    draftName.value = DEFAULT_BUILD_NAME;
    stored.value = { open: { kind: 'local', id }, lastLocalId: id };
  }

  function openCloud(id: string) {
    draftName.value = DEFAULT_BUILD_NAME;
    stored.value = {
      ...record.value,
      open: {
        kind: 'cloud',
        id,
        uid: useAuthStore().user?.uid ?? null,
        document: null
      }
    };
  }

  // * Called whenever the open cloud build's saved document changes: loaded, saved, or created.
  function cacheCloudDocument(document: SerializedBuild) {
    const entry = openCloudEntry.value;

    if (!entry) {
      return;
    }

    stored.value = {
      ...record.value,
      open: {
        ...entry,
        uid: entry.uid ?? useAuthStore().user?.uid ?? null,
        document
      }
    };
  }

  function closeBuild() {
    stored.value = { ...record.value, open: null };
  }

  // * After a delete the planner keeps the deleted build's contents, unsaved, and Save offers its name back.
  function closeDeletedBuild(name: string) {
    closeBuild();
    draftName.value = name;
  }

  return {
    openBuild,
    openLocalId,
    openCloudId,
    openCloudEntry,
    lastLocalId: computed(() => record.value.lastLocalId),
    requestedCloudId,
    draftName: readonly(draftName),
    openLocal,
    openCloud,
    cacheCloudDocument,
    closeBuild,
    closeDeletedBuild
  };
}

function isOpenBuildRecord(value: unknown): value is OpenBuildRecord {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const { open, lastLocalId } = value as Record<string, unknown>;

  if (lastLocalId !== null && typeof lastLocalId !== 'string') {
    return false;
  }

  if (open === null) {
    return true;
  }

  if (typeof open !== 'object' || open === undefined) {
    return false;
  }

  const { kind, id, document } = open as Record<string, unknown>;

  if (typeof id !== 'string' || (kind !== 'local' && kind !== 'cloud')) {
    return false;
  }

  // * A cached document is trusted only through the same gate a `?build=` link passes.
  return kind === 'local' || document == null || isSerializedBuild(document);
}
