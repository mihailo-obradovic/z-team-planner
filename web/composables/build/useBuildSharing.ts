import type { SerializedBuild } from '@/types/build';

export const BUILD_URL_PARAM = 'build';

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

  async function shareBuild(): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(getShareUrl());

      return true;
    } catch {
      return false;
    }
  }

  function readSharedBuildFromUrl(
    param: string | undefined
  ): SerializedBuild | null {
    return param ? decodeBuildFromUrl(param) : null;
  }

  function clearUrlParam() {
    const url = new URL(window.location.href);

    if (url.searchParams.has(BUILD_URL_PARAM)) {
      url.searchParams.delete(BUILD_URL_PARAM);
      window.history.replaceState({}, '', url.toString());
    }
  }

  return { getShareUrl, shareBuild, readSharedBuildFromUrl, clearUrlParam };
}
