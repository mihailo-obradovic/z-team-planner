import type { SerializedBuild } from '@/types/build';

// * A build document to and from the `?build=` parameter, in url-safe base64.
// * Padding is stripped and `+`/`/` are swapped for `-`/`_`, so the value survives being copied out of an address bar or pasted into a chat client that does not re-encode.

export function encodeBuildToUrl(build: SerializedBuild): string {
  return btoa(JSON.stringify(build))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

// * Returns `null` for anything that is not a build document this client understands — malformed base64, invalid JSON, or a payload the shared gate rejects.
export function decodeBuildFromUrl(encoded: string): SerializedBuild | null {
  try {
    const padded = encoded.replace(/-/g, '+').replace(/_/g, '/');
    const parsed: unknown = JSON.parse(atob(padded));

    // ! The stricter of the gate's two uses: an API response was validated server-side, but a `?build=` value is arbitrary input from whoever holds the link.
    return isSerializedBuild(parsed) ? parsed : null;
  } catch {
    return null;
  }
}
