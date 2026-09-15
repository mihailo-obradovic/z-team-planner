import type { SerializedBuild } from '@/types/build';

export function encodeBuildToUrl(buildDocument: SerializedBuild): string {
  return btoa(JSON.stringify(buildDocument))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export function decodeBuildFromUrl(encoded: string): SerializedBuild | null {
  try {
    const base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
    const parsed: unknown = JSON.parse(atob(base64));

    return isSerializedBuild(parsed) ? parsed : null;
  } catch {
    return null;
  }
}
