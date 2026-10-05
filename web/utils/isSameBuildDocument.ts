import type { SerializedBuild } from '@/types/build';

// * Equality as the server judges it (JSONB): key order is not part of a document, so it is not part of the comparison either.
export function isSameBuildDocument(
  left: SerializedBuild,
  right: SerializedBuild
): boolean {
  return canonical(left) === canonical(right);
}

function canonical(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(canonical).join(',')}]`;
  }

  if (value !== null && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    const entries = Object.keys(record)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonical(record[key])}`);

    return `{${entries.join(',')}}`;
  }

  return JSON.stringify(value);
}
