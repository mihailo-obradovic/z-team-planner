import type { SerializedBuild } from '@/types/build';

export const BUILD_URL_PARAM = 'build';

// * The `?build=` share link: writing the current planner into one, and reading one back out.
// * A link carries the build document itself, not a reference to a stored build — which is why it works signed out and why nothing here touches localStorage or the API.
export function useBuildSharing() {
  const state = usePlannerState();

  function getShareUrl(): string {
    const url = new URL(window.location.href);

    url.searchParams.set(
      BUILD_URL_PARAM,
      encodeBuildToUrl(serializeBuild(state))
    );

    return url.toString();
  }

  // * Resolves to whether the URL reached the clipboard; a denied permission or an insecure context is a `false`, not a throw.
  async function shareBuild(): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(getShareUrl());

      return true;
    } catch {
      return false;
    }
  }

  // * `null` when there is no parameter or it does not decode — the caller cannot tell the two apart because it treats them the same.
  function readSharedBuildFromUrl(
    param: string | undefined
  ): SerializedBuild | null {
    return param ? decodeBuildFromUrl(param) : null;
  }

  // * `replaceState`, so dropping the parameter neither navigates nor adds a history entry the back button would land on.
  function clearUrlParam() {
    const url = new URL(window.location.href);

    if (url.searchParams.has(BUILD_URL_PARAM)) {
      url.searchParams.delete(BUILD_URL_PARAM);
      window.history.replaceState({}, '', url.toString());
    }
  }

  return { getShareUrl, shareBuild, readSharedBuildFromUrl, clearUrlParam };
}
