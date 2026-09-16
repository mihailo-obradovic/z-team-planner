import {
  MAX_STAT_VALUE,
  SPECIAL_POWER_MECHANICS,
  STAT_NAMES
} from '@/types/hero';

import { RADAR_STAT_ORDER } from '@/utils/statIcons';
import { radarCoverage } from '@/utils/radarCoverage';

import type { HeroId, HeroStats, StatName, SynergyLevel } from '@/types/hero';
import type {
  IllusionRatio,
  MissionDerivedEffect,
  MissionTemplate,
  SlotPowerTraining
} from '@/types/mission';

export type SlotScore = {
  stats: HeroStats | null;
  effect: MissionDerivedEffect | null;
};

type SuccessInputs = {
  totals: HeroStats;
  template: MissionTemplate;
  synergyLevel: SynergyLevel;
  teamHasPair: boolean;
  reattempters: HeroId[];
};

// * Returns every step as well as the estimate, because the math panel renders each one.
export function scoreMission({
  totals,
  template,
  synergyLevel,
  teamHasPair,
  reattempters
}: SuccessInputs) {
  const coverage = radarCoverage(
    RADAR_STAT_ORDER.map((stat) => totals[stat]),
    RADAR_STAT_ORDER.map((stat) => template.req[stat])
  );
  // * The stored synergy level survives losing the pair and re-applies when one returns (feature 015).
  const synergyBonus = teamHasPair ? synergyLevel * 0.05 : 0;
  const singleAttempt = Math.min(1, coverage + synergyBonus);
  const failedStat = trippedFailStat(totals, template);
  const estimate =
    failedStat !== null
      ? 0
      : 1 - (1 - singleAttempt) ** (1 + reattempters.length);

  return { coverage, synergyBonus, reattempters, failedStat, estimate };
}

// * The team total is clamped per stat, because points past 10 are wasted (feature 015).
export function teamTotals(slotStats: (HeroStats | null)[]): HeroStats {
  return mapStats((stat) =>
    Math.min(
      slotStats.reduce((sum, stats) => sum + (stats?.[stat] ?? 0), 0),
      MAX_STAT_VALUE
    )
  );
}

export function trippedFailStat(
  totals: HeroStats,
  template: MissionTemplate
): StatName | null {
  return (
    STAT_NAMES.find((stat) => {
      const threshold = template.fail[stat];

      return threshold !== undefined && totals[stat] >= threshold;
    }) ?? null
  );
}

// * Null while the template carries no 2×XP threshold, and independent of the success estimate (feature 015).
export function xpFulfilled(
  totals: HeroStats,
  template: MissionTemplate
): boolean | null {
  const thresholds = Object.entries(template.xp) as [StatName, number][];

  if (thresholds.length === 0) {
    return null;
  }

  return thresholds.every(([stat, threshold]) => totals[stat] >= threshold);
}

// * Coupé's En Pointe pays by slot: combat in the first, mobility in the second, nothing further right.
export function enPointe(
  index: number,
  aLaSeconde: SlotPowerTraining
): { bonus: HeroStats; effect: MissionDerivedEffect | null } {
  const mechanics = SPECIAL_POWER_MECHANICS.coupe;
  const bonus =
    aLaSeconde === 'trained' ? mechanics.upgradeBonus : mechanics.baseBonus;
  const stat = index === 0 ? 'combat' : index === 1 ? 'mobility' : null;

  return {
    bonus: mapStats((name) => (name === stat ? bonus : 0)),
    effect: stat ? { type: 'en-pointe', stat, bonus } : null
  };
}

// * Golem's Spread Thin pays +25% of his own starting-plus-allocated stats per copy standing on the team.
export function spreadThin(
  ownStats: HeroStats,
  copies: number
): { bonus: HeroStats; effect: MissionDerivedEffect | null } {
  const factor = SPECIAL_POWER_MECHANICS.golem.percentPerSlot * copies;

  return {
    bonus: mapStats((stat) => Math.floor(ownStats[stat] * factor)),
    effect: copies > 0 ? { type: 'spread-thin', copies } : null
  };
}

// * An illusion mirrors its source live, never as a snapshot: half its stats floored per stat, or full once Perfect Copy is trained.
export function illusion(
  sourceStats: HeroStats,
  source: HeroId,
  ratio: IllusionRatio
): SlotScore {
  return {
    stats: mapStats((stat) => Math.floor(sourceStats[stat] * ratio)),
    effect: { type: 'illusion', source, ratio }
  };
}

function mapStats(value: (stat: StatName) => number): HeroStats {
  return Object.fromEntries(
    STAT_NAMES.map((stat) => [stat, value(stat)])
  ) as HeroStats;
}
