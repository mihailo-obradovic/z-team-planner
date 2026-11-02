import { describe, expect, it } from 'vitest';

import { canonicalSharePath } from '../../server/utils/canonicalSharePath.ts';

describe('canonicalSharePath', () => {
  it.each([
    ['/B/0b5f6c1e', '/b/0b5f6c1e'],
    ['/B', '/b'],
    ['/B/', '/b/'],
    ['/B/0b5f6c1e?ref=x', '/b/0b5f6c1e?ref=x'],
    ['/B?ref=x', '/b?ref=x']
  ])('sends %s to %s', (path, target) => {
    expect(canonicalSharePath(path)).toBe(target);
  });

  it.each(['/b/0b5f6c1e', '/b', '/', '/privacy', '/Builds', '/BX/1', '/a/B/1'])(
    'leaves %s alone',
    (path) => {
      expect(canonicalSharePath(path)).toBeUndefined();
    }
  );
});
