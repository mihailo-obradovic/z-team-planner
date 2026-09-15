import { STAT_NAMES } from '@/types/hero';
import { MISSION_TEMPLATE_COUNT } from '@/types/mission';

import type { HeroStats } from '@/types/hero';
import type { MissionTemplate } from '@/types/mission';

const REQ_MIN = 3;
const REQ_MAX = 8;
const THRESHOLD_MIN = 6;
const THRESHOLD_MAX = 9;
// * The common end-game failure with maxed heroes (feature 015).
const FAIL_EXAMPLE_STAT = 'combat';
const FAIL_EXAMPLE_VALUE = 8;

export function rollMissionTemplates(): MissionTemplate[] {
  return Array.from({ length: MISSION_TEMPLATE_COUNT }, (_, index) => {
    const template: MissionTemplate = { req: randomReqs(), xp: {}, fail: {} };

    if (index === 1) {
      template.xp[randomStat()] = randomInt(THRESHOLD_MIN, THRESHOLD_MAX);
    }

    if (index === 2) {
      template.fail[FAIL_EXAMPLE_STAT] = FAIL_EXAMPLE_VALUE;
    }

    return template;
  });
}

function randomReqs(): HeroStats {
  return Object.fromEntries(
    STAT_NAMES.map((stat) => [stat, randomInt(REQ_MIN, REQ_MAX)])
  ) as HeroStats;
}

function randomInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function randomStat() {
  return STAT_NAMES[randomInt(0, STAT_NAMES.length - 1)]!;
}
