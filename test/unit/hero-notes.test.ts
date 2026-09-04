import { describe, expect, it } from 'vitest';

import { STAT_NAMES } from '@/types/hero';
import {
  evaluateAdvisories,
  getHeroNote,
  HERO_NOTES,
  WATERBOY_EP8_NOTE,
  type HeroNoteContext
} from '@/utils/heroNotes';

import type { HeroStats } from '@/types/hero';

// * Coverage for catalyst/features/022_hero-notes.md: every advisory predicate at its
// * boundary, declaration order, and Waterboy's two mutually exclusive notes.

const ZERO_STATS: HeroStats = {
  combat: 0,
  intellect: 0,
  vigor: 0,
  charisma: 0,
  mobility: 0
};

function context(overrides: Partial<HeroNoteContext> = {}): HeroNoteContext {
  return {
    heroId: 'golem',
    rawStats: { ...ZERO_STATS },
    rosterAllocatedCombat: 0,
    ownAllocatedCombat: 0,
    supernovaTrained: false,
    supernovaAllocated: false,
    spreadThinTrained: false,
    wolfPackSelected: false,
    harderHeadSelected: false,
    golemBonusAvailable: false,
    alaSecondeReady: false,
    pairStats: [],
    ...overrides
  };
}

describe('getHeroNote', () => {
  it('returns the standard note for every hero except a mutually exclusive Waterboy case', () => {
    for (const heroId of Object.keys(
      HERO_NOTES
    ) as (keyof typeof HERO_NOTES)[]) {
      expect(getHeroNote(heroId, false)).toBe(HERO_NOTES[heroId]);
    }
  });

  it('swaps Waterboy to the episode-8 note only when hired then, never both', () => {
    expect(getHeroNote('waterboy', false)).toBe(HERO_NOTES.waterboy);
    expect(getHeroNote('waterboy', true)).toBe(WATERBOY_EP8_NOTE);
    expect(getHeroNote('waterboy', true)).not.toBe(HERO_NOTES.waterboy);
  });
});

describe('advisory 1 — roster Combat', () => {
  it('is silent at the boundary and fires just past it', () => {
    const atBoundary = evaluateAdvisories(
      context({ rosterAllocatedCombat: 4, ownAllocatedCombat: 1 })
    );
    const pastBoundary = evaluateAdvisories(
      context({ rosterAllocatedCombat: 5, ownAllocatedCombat: 1 })
    );

    expect(atBoundary.some((l) => l.id === 'roster-combat')).toBe(false);
    expect(pastBoundary.some((l) => l.id === 'roster-combat')).toBe(true);
  });

  it('is silent on a hero with no allocated Combat, even over the roster threshold', () => {
    const lines = evaluateAdvisories(
      context({ rosterAllocatedCombat: 6, ownAllocatedCombat: 0 })
    );

    expect(lines.some((l) => l.id === 'roster-combat')).toBe(false);
  });
});

describe('advisory 2 — Supernova waste', () => {
  it('fires only when trained and a point sits in Combat or Mobility', () => {
    const trainedNoAllocation = evaluateAdvisories(
      context({
        heroId: 'flambae',
        supernovaTrained: true,
        supernovaAllocated: false
      })
    );
    const trainedWithAllocation = evaluateAdvisories(
      context({
        heroId: 'flambae',
        supernovaTrained: true,
        supernovaAllocated: true
      })
    );

    expect(trainedNoAllocation.some((l) => l.id === 'supernova-waste')).toBe(
      false
    );
    expect(trainedWithAllocation.some((l) => l.id === 'supernova-waste')).toBe(
      true
    );
  });
});

describe('advisories 3 and 4 — pair-total waste and the raw-10 cap', () => {
  it('fires 3 only where allocation caused the excess, exempting a base-only overflow', () => {
    const baseOnly = evaluateAdvisories(
      context({
        pairStats: [{ stat: 'combat', pairTotal: 15, allocatedInPair: 0 }]
      })
    );
    const allocated = evaluateAdvisories(
      context({
        pairStats: [{ stat: 'combat', pairTotal: 12, allocatedInPair: 2 }]
      })
    );

    expect(baseOnly.some((l) => l.id === 'pair-waste-combat')).toBe(false);
    expect(allocated.some((l) => l.id === 'pair-waste-combat')).toBe(true);
    expect(allocated.find((l) => l.id === 'pair-waste-combat')!.text).toContain(
      '2 points wasted'
    );
  });

  it('is silent at raw 9 and fires at raw 10', () => {
    const nine = evaluateAdvisories(
      context({ rawStats: { ...ZERO_STATS, combat: 9 } })
    );
    const ten = evaluateAdvisories(
      context({ rawStats: { ...ZERO_STATS, combat: 10 } })
    );

    expect(nine.some((l) => l.id === 'stat-capped-combat')).toBe(false);
    expect(ten.some((l) => l.id === 'stat-capped-combat')).toBe(true);
  });

  it('suppresses 4 exactly on the stat where 3 already fires, not on others', () => {
    const lines = evaluateAdvisories(
      context({
        rawStats: { ...ZERO_STATS, combat: 10, mobility: 10 },
        pairStats: [
          { stat: 'combat', pairTotal: 12, allocatedInPair: 2 },
          { stat: 'mobility', pairTotal: 8, allocatedInPair: 0 }
        ]
      })
    );

    expect(lines.some((l) => l.id === 'stat-capped-combat')).toBe(false);
    expect(lines.some((l) => l.id === 'pair-waste-combat')).toBe(true);
    expect(lines.some((l) => l.id === 'stat-capped-mobility')).toBe(true);
  });
});

describe('advisory 5 — Spread Thin past 8', () => {
  it('is silent at 8 and fires at 9', () => {
    const eight = evaluateAdvisories(
      context({
        heroId: 'golem',
        spreadThinTrained: true,
        rawStats: { ...ZERO_STATS, vigor: 8 }
      })
    );
    const nine = evaluateAdvisories(
      context({
        heroId: 'golem',
        spreadThinTrained: true,
        rawStats: { ...ZERO_STATS, vigor: 9 }
      })
    );

    expect(eight.some((l) => l.id === 'spread-thin-cap-vigor')).toBe(false);
    expect(nine.some((l) => l.id === 'spread-thin-cap-vigor')).toBe(true);
  });

  it('requires Spread Thin to be trained, not just a high stat', () => {
    const lines = evaluateAdvisories(
      context({
        heroId: 'golem',
        spreadThinTrained: false,
        rawStats: { ...ZERO_STATS, vigor: 9 }
      })
    );

    expect(lines.some((l) => l.id.startsWith('spread-thin-cap'))).toBe(false);
  });
});

describe('advisories 6 and 7 — Wolf Pack and Harder Head', () => {
  it('fires only for the matching hero with the power selected', () => {
    expect(
      evaluateAdvisories(
        context({ heroId: 'invisigal', wolfPackSelected: true })
      ).some((l) => l.id === 'wolf-pack')
    ).toBe(true);
    expect(
      evaluateAdvisories(
        context({ heroId: 'invisigal', wolfPackSelected: false })
      ).some((l) => l.id === 'wolf-pack')
    ).toBe(false);

    expect(
      evaluateAdvisories(
        context({ heroId: 'punch-up', harderHeadSelected: true })
      ).some((l) => l.id === 'harder-head')
    ).toBe(true);
  });
});

describe('advisory 8 — Golem bonus suggestion', () => {
  it('fires only for Golem when a bonus point is available', () => {
    expect(
      evaluateAdvisories(
        context({ heroId: 'golem', golemBonusAvailable: true })
      ).some((l) => l.id === 'golem-bonus')
    ).toBe(true);
    expect(
      evaluateAdvisories(
        context({ heroId: 'invisigal', golemBonusAvailable: true })
      ).some((l) => l.id === 'golem-bonus')
    ).toBe(false);
  });
});

describe('advisory 9 — Coupé/Punch Up four-at-10 suggestion', () => {
  it('is gated strictly on alaSecondeReady and the right heroes', () => {
    expect(
      evaluateAdvisories(
        context({ heroId: 'coupe', alaSecondeReady: true })
      ).some((l) => l.id === 'coupe-punch-up-four-at-ten')
    ).toBe(true);
    expect(
      evaluateAdvisories(
        context({ heroId: 'coupe', alaSecondeReady: false })
      ).some((l) => l.id === 'coupe-punch-up-four-at-ten')
    ).toBe(false);
    expect(
      evaluateAdvisories(
        context({ heroId: 'golem', alaSecondeReady: true })
      ).some((l) => l.id === 'coupe-punch-up-four-at-ten')
    ).toBe(false);
  });
});

describe('advisory 10 — Spread Thin solo suggestion', () => {
  it('fires only for Golem with Spread Thin trained', () => {
    expect(
      evaluateAdvisories(
        context({ heroId: 'golem', spreadThinTrained: true })
      ).some((l) => l.id === 'spread-thin-solo')
    ).toBe(true);
    expect(
      evaluateAdvisories(
        context({ heroId: 'golem', spreadThinTrained: false })
      ).some((l) => l.id === 'spread-thin-solo')
    ).toBe(false);
  });
});

describe('declaration order', () => {
  it('renders warnings before suggestions, in table order, regardless of which are true', () => {
    const lines = evaluateAdvisories(
      context({
        heroId: 'golem',
        rosterAllocatedCombat: 5,
        ownAllocatedCombat: 1,
        spreadThinTrained: true,
        rawStats: { ...ZERO_STATS, combat: 1, vigor: 9 },
        golemBonusAvailable: true
      })
    );

    expect(lines.map((l) => l.id)).toEqual([
      'roster-combat',
      'spread-thin-cap-vigor',
      'golem-bonus',
      'spread-thin-solo'
    ]);
    expect(lines.filter((l) => l.kind === 'warning')).toHaveLength(2);
    expect(lines.filter((l) => l.kind === 'suggestion')).toHaveLength(2);
  });

  it('every stat name is covered by STAT_NAMES for the per-stat advisories', () => {
    // * Guards the fixtures above against a future stat being added without test coverage.
    expect(STAT_NAMES).toContain('combat');
    expect(STAT_NAMES).toHaveLength(5);
  });
});
