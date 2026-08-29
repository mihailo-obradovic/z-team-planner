// * Which build the planner opens with, decided once at startup.
// * The only place that reads the `?build=` parameter: a share link wins over whatever was open locally, and anything that will not decode falls back to the active local build rather than leaving the planner on defaults while the selector names a build (feature 001).
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
