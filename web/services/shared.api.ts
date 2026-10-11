import { SharedBuildSchema, type SharedBuild } from '@/types/api';

export async function fetchSharedBuild(
  id: string,
  signal?: AbortSignal
): Promise<SharedBuild> {
  // * `same-origin`, not the fetcher's `omit`: it is the one credentials mode a `<link rel="preload" as="fetch">` can express, and the share page's HTML preloads this read (decision 017, `server/plugins/b-share-preview.ts`). The API sets no cookies, so nothing is sent either way.
  return parseResponse(
    SharedBuildSchema,
    await fetcher(`/shared/${id}`, { signal, credentials: 'same-origin' })
  );
}
