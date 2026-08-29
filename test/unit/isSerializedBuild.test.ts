import { describe, expect, it } from 'vitest';

import { isSerializedBuild } from '@/utils/isSerializedBuild';

describe('isSerializedBuild', () => {
  it('accepts the minimal document', () => {
    expect(isSerializedBuild({ v: 1 })).toBe(true);
  });

  it('accepts a full one', () => {
    expect(
      isSerializedBuild({
        v: 1,
        ec: 'golem',
        eh: 'prism',
        e8: 1,
        lu: { golem: [2, 0, 0, 0, 0] },
        bl: { golem: 1 },
        pw: { golem: [1, 2] },
        sp: { coupe: 1 },
        fl: ['flambae']
      })
    ).toBe(true);
  });

  it.each([
    ['not an object', 'nope'],
    ['null', null],
    ['an array', [{ v: 1 }]],
    ['a missing version', { lu: {} }],
    ['a future version', { v: 2 }],
    ['a stringified version', { v: '1' }]
  ])('rejects %s', (_label, value) => {
    expect(isSerializedBuild(value)).toBe(false);
  });

  // ! The kinds that make deserializeIntoState throw rather than merely misread: `fl` is iterated with for-of and each `pw` entry is array-destructured.
  it.each([
    ['fl as a string', { v: 1, fl: 'flambae' }],
    ['pw as an array', { v: 1, pw: [1, 2] }],
    ['lu as a string', { v: 1, lu: 'golem' }],
    ['bl as an array', { v: 1, bl: [1] }],
    ['sp as a number', { v: 1, sp: 1 }],
    ['ec as a number', { v: 1, ec: 7 }],
    ['e8 as true', { v: 1, e8: true }]
  ])('rejects %s', (_label, value) => {
    expect(isSerializedBuild(value)).toBe(false);
  });

  // * Feature 001's format must stay backward-compatible, so a later client's document is still readable here.
  it('accepts a v1 document carrying a key this client does not know', () => {
    expect(isSerializedBuild({ v: 1, xx: { anything: true } })).toBe(true);
  });

  // * Contents are the API's five validation tiers (feature 005), never this guard's.
  it('does not police contents', () => {
    expect(isSerializedBuild({ v: 1, fl: ['not-a-hero'], bl: { x: 99 } })).toBe(
      true
    );
  });
});
