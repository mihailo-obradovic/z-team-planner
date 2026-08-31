import { beforeEach, describe, expect, it } from 'vitest';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import { defineComponent, h, nextTick } from 'vue';

import { STAT_NAMES } from '@/types/hero';

// * Feature 015, the success calculation: coverage + synergy make the single-attempt
// * chance, reattempt powers retry it, a tripped fail threshold zeroes it, and the 2×XP
// * light runs its own per-stat check beside all of that.

type Planner = ReturnType<typeof useHeroPlanner>;
type PlannerState = ReturnType<typeof usePlannerState>;

let planner!: Planner;
let state!: PlannerState;

beforeEach(async () => {
  await mountSuspended(
    defineComponent({
      setup() {
        planner = useHeroPlanner();
        state = usePlannerState();

        return () => h('div');
      }
    })
  );

  state.ep3Cut.value = 'sonar';
  state.ep4Hire.value = 'waterboy';
  state.showEp8Recruits.value = false;
  state.heroPowers.value = {};
  state.heroSpecialPowers.value = {};
  state.heroLevelUps.value = {};
  state.missionSlots.value = [null, null, null, null];
  state.missionSynergyLevel.value = 0;
  state.missionActiveTemplate.value = 0;

  // * Deterministic templates: REQ 5 across the board, no thresholds — each test sets what
  // * it needs through the guarded setters.
  state.missionTemplates.value = [0, 1, 2].map(() => ({
    req: Object.fromEntries(STAT_NAMES.map((stat) => [stat, 5])),
    xp: {},
    fail: {}
  })) as never;

  await nextTick();
});

function success() {
  return planner.missionSuccess.value;
}

function setAllReqs(value: number) {
  for (const stat of STAT_NAMES) {
    planner.setMissionReq(state.missionActiveTemplate.value, stat, value);
  }
}

describe('the estimate', () => {
  it('is 100% when nothing is required, 0% with no team', () => {
    setAllReqs(0);

    expect(success().estimate).toBe(1);

    setAllReqs(5);

    expect(success().coverage).toBe(0);
    expect(success().estimate).toBe(0);
  });

  it('is 100% when the team shape contains the required shape', () => {
    setAllReqs(2);
    planner.fillMissionSlot(0, 'golem');
    planner.fillMissionSlot(1, 'punch-up');

    expect(success().coverage).toBe(1);
    expect(success().estimate).toBe(1);
  });

  it('adds 5% per synergy level, only while the team holds a pair', () => {
    setAllReqs(10);
    planner.fillMissionSlot(0, 'golem');
    planner.fillMissionSlot(1, 'invisigal');

    const base = success();

    expect(base.coverage).toBeGreaterThan(0);
    expect(base.coverage).toBeLessThan(1);
    expect(base.synergyBonus).toBe(0);

    planner.setMissionSynergyLevel(2);

    expect(success().synergyBonus).toBeCloseTo(0.1, 10);
    expect(success().estimate).toBeCloseTo(base.coverage + 0.1, 10);

    // * The pair leaves; the stored level stays but contributes nothing.
    planner.removeMissionSlot(1);

    expect(state.missionSynergyLevel.value).toBe(2);
    expect(success().synergyBonus).toBe(0);
  });

  it('retries per reattempting hero: Pirouette trained, Talk Shit only in Hybrid', async () => {
    setAllReqs(10);
    state.ep3Cut.value = 'coupe';
    await nextTick();

    planner.fillMissionSlot(0, 'sonar');

    expect(success().reattempters).toEqual([]);

    planner.toggleStartingPower('sonar');
    planner.toggleTrainablePower('sonar', 2);

    const single = success().coverage;

    expect(success().reattempters).toEqual(['sonar']);
    expect(success().estimate).toBeCloseTo(1 - (1 - single) ** 2, 10);

    // * Mega Bat form: Talk Shit needs Hybrid.
    planner.toggleMonsterForm();

    expect(success().reattempters).toEqual([]);

    planner.toggleMonsterForm();
    planner.fillMissionSlot(1, 'malevola');
    planner.fillMissionSlot(2, 'punch-up');

    // * Malevola + Sonar is a pair; Punch Up only raises coverage. No Coupé — she is cut.
    expect(success().reattempters).toEqual(['sonar']);
  });

  it('fails at 0% when a FAIL ≥ stat is met, past synergy and reattempt', () => {
    planner.setMissionActiveTemplate(2);
    setAllReqs(3);
    planner.setMissionThreshold(2, 'fail', 'charisma', 8);
    planner.fillMissionSlot(0, 'malevola');
    planner.fillMissionSlot(1, 'punch-up');
    planner.fillMissionSlot(2, 'prism');

    // * Charisma 3 + 3 + 4 = 10 ≥ 8 — at-or-above trips.
    expect(success().failedStat).toBe('charisma');
    expect(success().estimate).toBe(0);

    planner.setMissionThreshold(2, 'fail', 'charisma', null);

    expect(success().failedStat).toBe(null);
    expect(success().estimate).toBeGreaterThan(0);
  });
});

describe('the 2×XP light', () => {
  it('is off the table without thresholds, and checks its stats independently', () => {
    expect(planner.missionXpFulfilled.value).toBe(null);

    planner.setMissionActiveTemplate(1);
    planner.setMissionThreshold(1, 'xp', 'combat', 7);

    expect(planner.missionXpFulfilled.value).toBe(false);

    planner.fillMissionSlot(0, 'coupe');
    planner.fillMissionSlot(1, 'flambae');

    // * Combat 4 + 1 (En Pointe, slot 1) + 4 = 9 ≥ 7 — fulfilled, whatever the estimate.
    expect(planner.missionXpFulfilled.value).toBe(true);
    expect(success().estimate).toBeLessThan(1);

    // * A second threshold must hold too.
    planner.setMissionThreshold(1, 'xp', 'intellect', 9);

    expect(planner.missionXpFulfilled.value).toBe(false);
  });
});
