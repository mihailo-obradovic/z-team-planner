export function useInitialBuild() {
  const state = usePlannerState();
  const { enterSharedMode } = useBuildMode();
  const { readSharedBuildFromUrl, clearUrlParam } = useBuildSharing();
  const { updateSavedSnapshot } = useUnsavedChanges();
  const { getActiveBuild } = useLocalBuilds();

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

      const active = getActiveBuild();

      if (active) {
        await deserializeBuild(active.data, state);
      }
    }

    updateSavedSnapshot();
  }

  return { loadInitialBuild };
}
