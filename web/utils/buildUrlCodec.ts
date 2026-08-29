import type { SerializedBuild } from '@/types/build';

export function encodeBuildToUrl(build: SerializedBuild): string {
  return btoa(JSON.stringify(build))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export function decodeBuildFromUrl(encoded: string): SerializedBuild | null {
  try {
    const padded = encoded.replace(/-/g, '+').replace(/_/g, '/');
    const parsed: unknown = JSON.parse(atob(padded));

    return isSerializedBuild(parsed) ? parsed : null;
  } catch {
    return null;
  }
}
