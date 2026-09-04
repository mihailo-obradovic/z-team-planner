import { MAX_STAT_VALUE, STAT_NAMES } from '@/types/hero';

import type { HeroId, HeroStats, StatName } from '@/types/hero';

// * Coverage for catalyst/features/022_hero-notes.md: the hero note per hero, and the pure
// * advisory predicates the composable feeds live planner state into. Kept framework-free so
// * every boundary can be pinned without mounting Nuxt.

export type AdvisoryKind = 'warning' | 'suggestion';

export interface AdvisoryLine {
  id: string;
  kind: AdvisoryKind;
  text: string;
}

export interface PairStat {
  stat: StatName;
  pairTotal: number;
  allocatedInPair: number;
}

// * Everything an advisory predicate needs, already reduced to plain values by the composable
// * — no HeroId lookups or planner reads happen inside evaluateAdvisories itself.
export interface HeroNoteContext {
  heroId: HeroId;
  rawStats: HeroStats;
  rosterAllocatedCombat: number;
  ownAllocatedCombat: number;
  supernovaTrained: boolean;
  supernovaAllocated: boolean;
  spreadThinTrained: boolean;
  wolfPackSelected: boolean;
  harderHeadSelected: boolean;
  golemBonusAvailable: boolean;
  alaSecondeReady: boolean;
  pairStats: PairStat[];
}

export const HERO_NOTES: Record<HeroId, string> = {
  coupe:
    'Her slot position decides which bonus she gets, so where you place her matters more than for anyone else.',
  flambae:
    'A win-more hero: he can deliver huge results once he is rolling. Whichever power you take, a loss is expensive.',
  golem:
    'His value is breadth rather than any single peak. Points given to him are the least likely to be wasted.',
  invisigal:
    'Starts with 11 stat points, one short of the usual 12, and reaches the same ceiling as everyone else.',
  malevola:
    'Versatile: she can be built around whatever the rest of the team is short of. Her powers see few uses on a clean run.',
  phenomaman:
    'Fixed at rank 12 and cannot gain XP. Every call he joins burns a share of that call’s XP pool.',
  prism:
    "If you're already comfortable completing the call, remove her clone to keep it from taking a share of the XP.",
  'punch-up':
    'Usually built with Vigor and Charisma maxed, which sit apart on the chart — a weak solo pick that way, but one of the strongest synergy pairs in the game.',
  sonar:
    'He alternates between two stat distributions from call to call. He always starts a shift in hybrid form, so the hybrid spread is the one you will use more often.',
  waterboy:
    'Starts with 8 stat points, four short of the usual 12. His low Combat suits calls that fail when team Combat runs too high.',
  'blonde-blazer':
    'Fixed at rank 20 with 36 stat points. She accepts no allocation and has only her starting power.'
};

export const WATERBOY_EP8_NOTE =
  'Hired in episode 8 he joins at rank 1 with only his starting power, for a marginally harder endgame.';

export function getHeroNote(heroId: HeroId, isEp8Waterboy: boolean): string {
  if (heroId === 'waterboy' && isEp8Waterboy) {
    return WATERBOY_EP8_NOTE;
  }

  return HERO_NOTES[heroId];
}

function capitalize(stat: StatName): string {
  return stat[0]!.toUpperCase() + stat.slice(1);
}

// * Declaration order is the render order: warnings 1-7, then suggestions 8-10, only the
// * true ones. Advisories 3 and 4 are per-stat and can each contribute more than one line.
export function evaluateAdvisories(ctx: HeroNoteContext): AdvisoryLine[] {
  const lines: AdvisoryLine[] = [];

  // * #1 — roster-wide allocated Combat, shown on every hero with an allocated point in it.
  if (ctx.rosterAllocatedCombat > 4 && ctx.ownAllocatedCombat > 0) {
    lines.push({
      id: 'roster-combat',
      kind: 'warning',
      text: "Combat is the least required stat — late missions can fail if it's too high."
    });
  }

  // * #2 — Supernova overwrites Combat/Mobility outright; any point spent there is wasted.
  if (
    ctx.heroId === 'flambae' &&
    ctx.supernovaTrained &&
    ctx.supernovaAllocated
  ) {
    lines.push({
      id: 'supernova-waste',
      kind: 'warning',
      text: 'Supernova sets Combat and Mobility to 10 on its own — those points are wasted.'
    });
  }

  // * #3 — per stat, per synergy pair: waste is what allocation contributed beyond 10.
  const pairWasteStats = new Set<StatName>();

  for (const pairStat of ctx.pairStats) {
    const excess = pairStat.pairTotal - MAX_STAT_VALUE;

    if (excess > 0 && pairStat.allocatedInPair > 0) {
      const waste = Math.min(excess, pairStat.allocatedInPair);

      pairWasteStats.add(pairStat.stat);
      lines.push({
        id: `pair-waste-${pairStat.stat}`,
        kind: 'warning',
        text: `This pair's ${capitalize(pairStat.stat)} exceeds what a call can use — ${waste} point${waste === 1 ? '' : 's'} wasted.`
      });
    }
  }

  // * #4 — a raw stat at the cap, deferring to #3 wherever it already quantifies the same waste.
  for (const stat of STAT_NAMES) {
    if (ctx.rawStats[stat] >= MAX_STAT_VALUE && !pairWasteStats.has(stat)) {
      lines.push({
        id: `stat-capped-${stat}`,
        kind: 'warning',
        text: `${capitalize(stat)} at 10 only helps the Min Max achievement — wasted once paired.`
      });
    }
  }

  // * #5 — past 8, Spread Thin's own bonus already reaches the cap.
  if (ctx.heroId === 'golem' && ctx.spreadThinTrained) {
    for (const stat of STAT_NAMES) {
      if (ctx.rawStats[stat] > 8) {
        lines.push({
          id: `spread-thin-cap-${stat}`,
          kind: 'warning',
          text: `Past 8, Spread Thin alone reaches the cap on ${capitalize(stat)} — further points wasted.`
        });
      }
    }
  }

  // * #6 — Wolf Pack rarely pays off; XP is usually maxed before it matters.
  if (ctx.heroId === 'invisigal' && ctx.wolfPackSelected) {
    lines.push({
      id: 'wolf-pack',
      kind: 'warning',
      text: 'Wolf Pack rarely pays off — XP is usually maxed well before it matters.'
    });
  }

  // * #7 — Harder Head needs him hurt to pay off; Squeeze In is the stronger pick.
  if (ctx.heroId === 'punch-up' && ctx.harderHeadSelected) {
    lines.push({
      id: 'harder-head',
      kind: 'warning',
      text: 'Harder Head needs him hurt to pay off — Squeeze In is the stronger pick.'
    });
  }

  // * #8 — Golem is a strong recipient for a spare bonus point.
  if (ctx.heroId === 'golem' && ctx.golemBonusAvailable) {
    lines.push({
      id: 'golem-bonus',
      kind: 'suggestion',
      text: 'Golem is a strong spare-point recipient — little is wasted on him.'
    });
  }

  // * #9 — arithmetic only, once À la Seconde is already trained; never an argument for taking it.
  if (
    (ctx.heroId === 'coupe' || ctx.heroId === 'punch-up') &&
    ctx.alaSecondeReady
  ) {
    lines.push({
      id: 'coupe-punch-up-four-at-ten',
      kind: 'suggestion',
      text: 'With À la Seconde already trained, this pair can reach four stats at 10 between them.'
    });
  }

  // * #10 — with Spread Thin trained, Golem can solo multi-slot calls effectively.
  if (ctx.heroId === 'golem' && ctx.spreadThinTrained) {
    lines.push({
      id: 'spread-thin-solo',
      kind: 'suggestion',
      text: 'With Spread Thin trained, he can solo multi-slot calls effectively.'
    });
  }

  return lines;
}
