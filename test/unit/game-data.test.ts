import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { buildGameData } from '../../scripts/export-game-data.ts';

describe('shared/game-data.json', () => {
  it('equals a fresh export', () => {
    // ! The committed fixture is what the API validates a saved build against. If hero.ts changes and this fails, run `pnpm run game-data:export` and commit the result in the same change (feature 005, Invariants).
    const committed = JSON.parse(readFileSync('shared/game-data.json', 'utf8'));

    expect(committed).toEqual(buildGameData());
  });

  it('derives trainable power counts from the named slots', () => {
    const data = buildGameData();

    // * Blonde Blazer's two trainable slots are empty placeholders in HERO_POWERS, not powers.
    expect(data.heroes['blonde-blazer']?.trainable_powers).toBe(0);
    expect(data.heroes.coupe?.trainable_powers).toBe(2);
  });

  it('carries every hero, in STAT_NAMES order', () => {
    const data = buildGameData();

    expect(Object.keys(data.heroes)).toHaveLength(11);
    expect(data.stat_names).toEqual([
      'combat',
      'intellect',
      'vigor',
      'charisma',
      'mobility'
    ]);
    // * Coupé's starting stats from catalyst/context/game-mechanics.md, in that order.
    expect(data.heroes.coupe?.starting_stats).toEqual([4, 3, 1, 1, 3]);
  });
});
