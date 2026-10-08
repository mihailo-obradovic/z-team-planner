import { useCreateBuild } from '@/services/queries/useBuildQueries';

import type { SerializedBuild } from '@/types/build';

const BLANK_BUILD: SerializedBuild = { v: 1 };

// * New build: a blank planner under the default name, created at once where new builds go — the account when signed in, this browser otherwise (feature 029).
export function useNewBuild() {
  const toast = useToast();
  const state = usePlannerState();
  const { isSignedIn } = storeToRefs(useAuthStore());
  const { openCloud } = useOpenBuild();
  const { saveAsNewLocalBuild } = useLocalBuilds();
  const { loadAccountBuild } = useBuildMode();
  const { updateSavedSnapshot } = useUnsavedChanges();

  // * The planner is blanked only once the build exists: a create the account's limit refuses leaves the planner as it was.
  const { mutate: createCloudBuild, isLoading: isCreating } = useCreateBuild({
    onSuccess: async (created) => {
      openCloud(created.id);
      await loadAccountBuild(BLANK_BUILD);
      updateSavedSnapshot(BLANK_BUILD);
      toast.add({ title: `Created "${created.name}"`, color: 'success' });
    }
  });

  async function startNewBuild() {
    if (isSignedIn.value) {
      createCloudBuild({ name: DEFAULT_BUILD_NAME, data: BLANK_BUILD });

      return;
    }

    await deserializeBuild(BLANK_BUILD, state);

    const name = saveAsNewLocalBuild(DEFAULT_BUILD_NAME);

    toast.add({ title: `Created "${name}"`, color: 'success' });
  }

  return { startNewBuild, isCreating };
}
