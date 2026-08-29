import { SharedBuildSchema, type SharedBuild } from '@/types/api';

export async function fetchSharedBuild(id: string): Promise<SharedBuild> {
  return parseResponse(SharedBuildSchema, await fetcher(`/shared/${id}`));
}
