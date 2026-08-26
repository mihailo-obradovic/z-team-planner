import { PublicBuildSchema, type PublicBuild } from '@/types/api';

/** The public read. No token, and the response never carries the owner. */
export async function fetchSharedBuild(id: string): Promise<PublicBuild> {
  return parseResponse(PublicBuildSchema, await fetcher(`/shared/${id}`));
}
