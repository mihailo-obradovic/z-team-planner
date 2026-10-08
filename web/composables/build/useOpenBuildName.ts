import {
  useFetchBuild,
  useFetchBuilds
} from '@/services/queries/useBuildQueries';

// * The open build's name, whichever kind it is, or the name Save offers while nothing is open (feature 029). The header, Rename and Delete all read it.
export function useOpenBuildName() {
  const { openCloudId, draftName } = useOpenBuild();
  const { activeBuildName } = useLocalBuilds();

  const { data: accountBuilds } = useFetchBuilds();
  const { data: openedAccountBuild } = useFetchBuild(openCloudId);

  return computed(() => {
    if (!openCloudId.value) {
      return activeBuildName.value;
    }

    // * The list renames first after a `PATCH`; the single build may still be the one fetched before it.
    return (
      accountBuilds.value?.items.find(
        (cloudBuild) => cloudBuild.id === openCloudId.value
      )?.name ??
      openedAccountBuild.value?.name ??
      draftName.value
    );
  });
}
