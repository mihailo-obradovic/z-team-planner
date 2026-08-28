import { MeSchema, type Me } from '@/types/api';

export async function fetchMe(): Promise<Me> {
  return parseResponse(MeSchema, await fetcher('/me'));
}

export async function deleteMe(): Promise<void> {
  await fetcher('/me', { method: 'DELETE' });
}
