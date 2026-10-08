import { describe, expect, it } from 'vitest';

import { DEFAULT_BUILD_NAME, freeBuildName } from '@/utils/buildName';

describe('freeBuildName', () => {
  it('keeps a name nobody has', () => {
    expect(freeBuildName(['Main'], 'Alt')).toBe('Alt');
  });

  it('suffixes a taken name from 2', () => {
    expect(freeBuildName(['Main'], 'Main')).toBe('Main (2)');
  });

  it('takes the smallest free n', () => {
    expect(freeBuildName(['Main', 'Main (2)', 'Main (4)'], 'Main')).toBe(
      'Main (3)'
    );
  });

  it('compares after trimming', () => {
    expect(freeBuildName(['Main'], '  Main  ')).toBe('Main (2)');
  });

  it('is case-sensitive', () => {
    expect(freeBuildName(['Main'], 'main')).toBe('main');
  });

  it('gives an empty name the default', () => {
    expect(freeBuildName([DEFAULT_BUILD_NAME], '   ')).toBe('New build (2)');
  });

  it('leaves a rename to the build’s own name unchanged when its name is left out of the taken set', () => {
    expect(freeBuildName(['Alt'], 'Main')).toBe('Main');
  });
});
