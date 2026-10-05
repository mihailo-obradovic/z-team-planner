import { MeSchema, type Me } from '@/types/api';

export async function fetchMe(signal?: AbortSignal): Promise<Me> {
  return parseResponse(MeSchema, await fetcher('/me', { signal }));
}

export async function deleteMe(): Promise<void> {
  await fetcher('/me', { method: 'DELETE' });
}
