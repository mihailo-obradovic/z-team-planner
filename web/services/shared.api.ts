import { PublicBuildSchema, type PublicBuild } from '@/types/api';

export async function fetchSharedBuild(id: string): Promise<PublicBuild> {
  return parseResponse(PublicBuildSchema, await fetcher(`/shared/${id}`));
}
