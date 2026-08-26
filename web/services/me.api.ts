import { MeSchema, type Me } from '@/types/api';

export async function fetchMe(): Promise<Me> {
  return parseResponse(MeSchema, await fetcher('/me'));
}

export async function deleteMe(): Promise<void> {
  // * 204. Deletes the row, every build, and the Firebase user (feature 004).
  await fetcher('/me', { method: 'DELETE' });
}
