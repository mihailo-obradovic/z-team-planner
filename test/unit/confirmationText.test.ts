import { describe, expect, it } from 'vitest';

import { confirmationText } from '@/utils/confirmationText';

// * Coverage for catalyst/features/018_hints-and-confirmations.md, Examples: the wording of every chip's confirmation, and `null` on every deactivation.
describe('confirmationText', () => {
  it('names a revealed starting power and nothing when it is hidden', () => {
    expect(
      confirmationText({ kind: 'starting', name: 'On Fire', revealed: true })
    ).toBe('On Fire revealed');
    expect(
      confirmationText({ kind: 'starting', name: 'On Fire', revealed: false })
    ).toBeNull();
  });

  it('names a trained upgrade power and nothing when it is untrained', () => {
    expect(
      confirmationText({ kind: 'upgrade', name: 'Comet', trained: true })
    ).toBe('Comet trained');
    expect(
      confirmationText({ kind: 'upgrade', name: 'Comet', trained: false })
    ).toBeNull();
  });

  it('names trained flight, falling back to "Flight" for an unnamed one', () => {
    expect(
      confirmationText({ kind: 'flight', name: 'Wingsuit', trained: true })
    ).toBe('Wingsuit trained');
    expect(
      confirmationText({ kind: 'flight', name: null, trained: true })
    ).toBe('Flight trained');
    expect(
      confirmationText({ kind: 'flight', name: 'Wingsuit', trained: false })
    ).toBeNull();
  });

  it('says Supernova on, and nothing when it goes off', () => {
    expect(confirmationText({ kind: 'supernova', on: true })).toBe(
      'Supernova on'
    );
    expect(confirmationText({ kind: 'supernova', on: false })).toBeNull();
  });

  it("names Sonar's resulting form in both directions", () => {
    expect(confirmationText({ kind: 'monster-form', form: 'mega-bat' })).toBe(
      'Mega Bat Form'
    );
    expect(confirmationText({ kind: 'monster-form', form: 'hybrid' })).toBe(
      'Hybrid Form'
    );
  });

  it('names the En Pointe cycle position with its bonus, and nothing at off', () => {
    expect(confirmationText({ kind: 'en-pointe', state: 1, bonus: 1 })).toBe(
      'En Pointe: Combat +1'
    );
    expect(confirmationText({ kind: 'en-pointe', state: 2, bonus: 1 })).toBe(
      'En Pointe: Mobility +1'
    );
    expect(confirmationText({ kind: 'en-pointe', state: 1, bonus: 3 })).toBe(
      'En Pointe: Combat +3'
    );
    expect(
      confirmationText({ kind: 'en-pointe', state: 0, bonus: 3 })
    ).toBeNull();
  });

  it('names the Spread Thin slot count, singular at one, and nothing at off', () => {
    expect(confirmationText({ kind: 'spread-thin', slots: 1 })).toBe(
      'Spread Thin: +1 slot'
    );
    expect(confirmationText({ kind: 'spread-thin', slots: 2 })).toBe(
      'Spread Thin: +2 slots'
    );
    expect(confirmationText({ kind: 'spread-thin', slots: 3 })).toBe(
      'Spread Thin: +3 slots'
    );
    expect(confirmationText({ kind: 'spread-thin', slots: 0 })).toBeNull();
  });
});
