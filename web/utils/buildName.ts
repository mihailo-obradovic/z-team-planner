export const DEFAULT_BUILD_NAME = 'New build';

// * The first free name within one collection: `wanted` trimmed, or with the smallest free ` (n)` from 2 (feature 029).
// ! Mirrors the server's `free_name` exactly, so a name means the same thing in both collections. For a rename, leave the build's own name out of `taken`.
export function freeBuildName(taken: Iterable<string>, wanted: string): string {
  const takenNames = new Set(taken);
  const name = wanted.trim() || DEFAULT_BUILD_NAME;

  if (!takenNames.has(name)) {
    return name;
  }

  let suffix = 2;

  while (takenNames.has(`${name} (${suffix})`)) {
    suffix += 1;
  }

  return `${name} (${suffix})`;
}
