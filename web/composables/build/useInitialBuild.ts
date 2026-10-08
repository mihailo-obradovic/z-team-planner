export function useInitialBuild() {
  const state = usePlannerState();
  const { enterSharedMode } = useBuildMode();
  const { readSharedBuildFromUrl, clearUrlParam } = useBuildSharing();
  const { updateSavedSnapshot } = useUnsavedChanges();
  const { getActiveBuild } = useLocalBuilds();
  const { openCloudEntry } = useOpenBuild();

  async function loadInitialBuild() {
    if (import.meta.server) {
      return;
    }

    const route = useRoute();
    const param = route.query[BUILD_URL_PARAM] as string | undefined;
    const shared = readSharedBuildFromUrl(param);

    if (shared) {
      enterSharedMode();

      await deserializeBuild(shared, state);
    } else {
      // * No parameter, or one that would not decode. Strip the dead value so a reload cannot re-trip on it, then fall back to the active local build.
      if (param) {
        clearUrlParam();
      }

      // * An open cloud build paints from its cached document at once; `useOpenBuildSync` replaces it with the fetched one, or falls back when the cache is not this user's (feature 029).
      const opened = getActiveBuild()?.data ?? openCloudEntry.value?.document;

      if (opened) {
        await deserializeBuild(opened, state);
      }
    }

    updateSavedSnapshot();
  }

  return { loadInitialBuild };
}
