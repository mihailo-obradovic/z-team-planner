import { beforeEach, describe, expect, it } from 'vitest';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import { defineComponent, h, nextTick } from 'vue';

import { rollMissionTemplates } from '@/utils/missionTemplates';

import type { MissionSlot } from '@/types/mission';

// * Feature 015, team mechanics: positional slots, guarded writes, the illusion lifecycle,
// * and the sanitize watcher that drops what episode setup hides.

type Planner = ReturnType<typeof useHeroPlanner>;
type PlannerState = ReturnType<typeof usePlannerState>;

let planner!: Planner;
let state!: PlannerState;

async function mountPlanner() {
  await mountSuspended(
    defineComponent({
      setup() {
        planner = useHeroPlanner();
        state = usePlannerState();

        return () => h('div');
      }
    })
  );
}

beforeEach(async () => {
  await mountPlanner();

  // * Reset between tests: useState survives the module's lifetime. Direct writes are setup,
  // * not behavior — the actions under test are the guarded ones.
  state.ep3Cut.value = 'sonar';
  state.ep4Hire.value = 'waterboy';
  state.showEp8Recruits.value = false;
  state.missionSlots.value = [null, null, null, null];
  state.missionTemplates.value = rollMissionTemplates();
  state.missionSynergyLevel.value = 0;
  state.missionActiveTemplate.value = 0;
  await nextTick();
});

function slots(): MissionSlot[] {
  return state.missionSlots.value;
}

describe('mission slots', () => {
  it('fills any slot with a visible hero, in place', () => {
    planner.fillMissionSlot(2, 'golem');

    expect(slots()).toEqual([null, null, 'golem', null]);
  });

  it('refuses a hero already on the team, an invisible hero, and a bad index', () => {
    planner.fillMissionSlot(0, 'golem');
    planner.fillMissionSlot(1, 'golem');
    planner.fillMissionSlot(1, 'sonar');
    planner.fillMissionSlot(1, 'blonde-blazer');
    planner.fillMissionSlot(4, 'coupe');

    expect(slots()).toEqual(['golem', null, null, null]);
  });

  it('replaces a slot occupant directly', () => {
    planner.fillMissionSlot(0, 'golem');
    planner.fillMissionSlot(0, 'coupe');

    expect(slots()).toEqual(['coupe', null, null, null]);
  });

  it('removes on demand and moves by swapping with the neighbor', () => {
    planner.fillMissionSlot(0, 'golem');
    planner.fillMissionSlot(1, 'coupe');

    planner.moveMissionSlot(1, 1);

    expect(slots()).toEqual(['golem', null, 'coupe', null]);

    planner.moveMissionSlot(0, 1);

    expect(slots()).toEqual([null, 'golem', 'coupe', null]);

    planner.removeMissionSlot(2);

    expect(slots()).toEqual([null, 'golem', null, null]);
  });

  it('drops a hero the episode setup hides, and a recruit when episode 8 turns off', async () => {
    state.showEp8Recruits.value = true;
    await nextTick();

    planner.fillMissionSlot(0, 'coupe');
    planner.fillMissionSlot(1, 'blonde-blazer');

    state.ep3Cut.value = 'coupe';
    await nextTick();

    expect(slots()).toEqual([null, 'blonde-blazer', null, null]);

    state.showEp8Recruits.value = false;
    await nextTick();

    expect(slots()).toEqual([null, null, null, null]);
  });
});

describe('the illusion', () => {
  it("appears to Prism's right when she lands with a hero to her left", () => {
    planner.fillMissionSlot(0, 'golem');
    planner.fillMissionSlot(1, 'prism');

    expect(slots()).toEqual(['golem', 'prism', 'illusion', null]);
  });

  it('does not appear in slot 1, at slot 4, or over an occupied slot', () => {
    planner.fillMissionSlot(0, 'prism');

    expect(slots()).toEqual(['prism', null, null, null]);

    planner.removeMissionSlot(0);
    planner.fillMissionSlot(2, 'golem');
    planner.fillMissionSlot(3, 'prism');

    expect(slots()).toEqual([null, null, 'golem', 'prism']);

    planner.removeMissionSlot(3);
    planner.removeMissionSlot(2);
    planner.fillMissionSlot(0, 'coupe');
    planner.fillMissionSlot(2, 'golem');
    planner.fillMissionSlot(1, 'prism');

    // * Slot 2 was already Golem's — no illusion over him.
    expect(slots()).toEqual(['coupe', 'prism', 'golem', null]);
  });

  it('is removable, stays gone, and returns when Prism is placed again', async () => {
    planner.fillMissionSlot(0, 'golem');
    planner.fillMissionSlot(1, 'prism');
    planner.removeMissionSlot(2);
    await nextTick();

    expect(slots()).toEqual(['golem', 'prism', null, null]);

    // * Re-placing her is the one creation event.
    planner.removeMissionSlot(1);
    planner.fillMissionSlot(1, 'prism');
    await nextTick();

    expect(slots()).toEqual(['golem', 'prism', 'illusion', null]);
  });

  it('vanishes when Prism or her source leaves, and can be replaced by a hero', async () => {
    planner.fillMissionSlot(0, 'golem');
    planner.fillMissionSlot(1, 'prism');

    planner.removeMissionSlot(0);
    await nextTick();

    // * No hero to her left any more — the illusion loses its context.
    expect(slots()).toEqual([null, 'prism', null, null]);

    planner.fillMissionSlot(0, 'golem');
    planner.fillMissionSlot(1, 'prism');
    planner.fillMissionSlot(2, 'coupe');
    await nextTick();

    expect(slots()).toEqual(['golem', 'prism', 'coupe', null]);

    planner.removeMissionSlot(1);
    await nextTick();

    expect(slots()).toEqual(['golem', null, 'coupe', null]);
  });

  it('is dropped on load when its context does not hold', async () => {
    state.missionSlots.value = ['golem', 'illusion', null, 'coupe'];
    await nextTick();

    expect(slots()).toEqual(['golem', null, null, 'coupe']);
  });
});

describe('mission templates and settings', () => {
  it('writes a REQ inside 0–10 and refuses the rest', () => {
    planner.setMissionReq(0, 'combat', 10);
    planner.setMissionReq(0, 'vigor', 0);
    planner.setMissionReq(0, 'intellect', 11);
    planner.setMissionReq(0, 'charisma', -1);
    planner.setMissionReq(3, 'combat', 5);

    const template = state.missionTemplates.value![0]!;

    expect(template.req.combat).toBe(10);
    expect(template.req.vigor).toBe(0);
    expect(template.req.intellect).toBeLessThanOrEqual(8);
    expect(template.req.charisma).toBeGreaterThanOrEqual(3);
  });

  it('sets both condition columns on any template, in range, null unsets', () => {
    // * Deterministic start: the rolled thresholds could land on the stats asserted below.
    state.missionTemplates.value = state.missionTemplates.value!.map(
      (entry) => ({ ...entry, xp: {}, fail: {} })
    );

    planner.setMissionThreshold(0, 'xp', 'combat', 7);
    planner.setMissionThreshold(0, 'fail', 'vigor', 9);
    planner.setMissionThreshold(2, 'xp', 'mobility', 6);
    planner.setMissionThreshold(2, 'fail', 'vigor', 11);
    planner.setMissionThreshold(3, 'fail', 'combat', 5);

    const templates = state.missionTemplates.value!;

    expect(templates[0]!.xp.combat).toBe(7);
    expect(templates[0]!.fail.vigor).toBe(9);
    expect(templates[2]!.xp.mobility).toBe(6);
    expect(templates[2]!.fail.vigor).toBeUndefined();

    planner.setMissionThreshold(0, 'xp', 'combat', null);

    expect(state.missionTemplates.value![0]!.xp.combat).toBeUndefined();
  });

  it('clamps the synergy level and active template to their ranges', () => {
    planner.setMissionSynergyLevel(3);
    planner.setMissionActiveTemplate(2);

    expect(state.missionSynergyLevel.value).toBe(3);
    expect(state.missionActiveTemplate.value).toBe(2);

    planner.setMissionSynergyLevel(4 as 3);
    planner.setMissionActiveTemplate(3);

    expect(state.missionSynergyLevel.value).toBe(3);
    expect(state.missionActiveTemplate.value).toBe(2);
  });

  it('reports whether the team holds a derived synergy pair', () => {
    planner.fillMissionSlot(0, 'golem');

    expect(planner.missionTeamHasPair.value).toBe(false);

    planner.fillMissionSlot(1, 'invisigal');

    expect(planner.missionTeamHasPair.value).toBe(true);

    planner.removeMissionSlot(0);

    expect(planner.missionTeamHasPair.value).toBe(false);
  });
});

describe('derived slot effects and team totals', () => {
  beforeEach(() => {
    state.heroPowers.value = {};
    state.heroSpecialPowers.value = {};
    state.heroLevelUps.value = {};
  });

  function totals() {
    return planner.missionTeamTotals.value;
  }

  it('gives Coupé +1 Combat in slot 1 and +1 Mobility in slot 2, nothing beyond', () => {
    planner.fillMissionSlot(0, 'coupe');

    expect(totals().combat).toBe(5);

    planner.removeMissionSlot(0);
    planner.fillMissionSlot(1, 'coupe');

    expect(totals().combat).toBe(4);
    expect(totals().mobility).toBe(4);

    planner.removeMissionSlot(1);
    planner.fillMissionSlot(2, 'coupe');

    expect(totals().combat).toBe(4);
    expect(totals().mobility).toBe(3);
  });

  it('pays Coupé +3 once À la Seconde is trained, whatever her manual chip says', () => {
    planner.toggleStartingPower('coupe');
    planner.toggleTrainablePower('coupe', 2);
    planner.fillMissionSlot(0, 'coupe');

    expect(totals().combat).toBe(7);

    // * The manual En Pointe chip points at mobility — the simulator ignores it.
    planner.toggleSpecialPower('coupe');
    planner.toggleSpecialPower('coupe');

    expect(totals().combat).toBe(7);
    expect(totals().mobility).toBe(3);
  });

  it('spawns copies to his right when trained, each paying +25%', async () => {
    planner.fillMissionSlot(0, 'golem');

    // * Untrained: no copies, no expansion.
    expect(slots()).toEqual(['golem', null, null, null]);
    expect(totals().vigor).toBe(4);

    // * Training alone spawns nothing — placement is the event.
    planner.toggleStartingPower('golem');
    planner.toggleTrainablePower('golem', 1);

    expect(slots()).toEqual(['golem', null, null, null]);

    planner.removeMissionSlot(0);
    planner.fillMissionSlot(0, 'golem');

    // * Placed trained: copies fill every free slot to his right — +75%: 3/1/4/2/2 → 5/1/7/3/3.
    expect(slots()).toEqual(['golem', 'copy', 'copy', 'copy']);
    expect(totals().combat).toBe(5);
    expect(totals().intellect).toBe(1);
    expect(totals().vigor).toBe(7);

    // * Copies dissolve right-to-left only: the inner X is a no-op, the outer works.
    planner.removeMissionSlot(1);
    await nextTick();

    expect(slots()).toEqual(['golem', 'copy', 'copy', 'copy']);

    planner.removeMissionSlot(3);
    planner.removeMissionSlot(2);
    await nextTick();

    // * One copy left: floor(4 × 0.25) = +1 vigor.
    expect(slots()).toEqual(['golem', 'copy', null, null]);
    expect(totals().vigor).toBe(5);

    // * Untraining dissolves what remains.
    planner.toggleTrainablePower('golem', 1);
    await nextTick();

    expect(slots()).toEqual(['golem', null, null, null]);
    expect(totals().vigor).toBe(4);
  });

  it('halves the illusion floored and mirrors its source live', () => {
    planner.fillMissionSlot(0, 'golem');
    planner.fillMissionSlot(1, 'prism');

    expect(slots()).toEqual(['golem', 'prism', 'illusion', null]);

    // * Golem 3/1/4/2/2; the illusion mirrors him at half, floored: 1/0/2/1/1.
    // * Prism adds 4/2/1/4/1.
    expect(totals().combat).toBe(3 + 4 + 1);
    expect(totals().vigor).toBe(4 + 1 + 2); // golem + prism + illusion
    expect(totals().intellect).toBe(1 + 2 + 0);

    // * Perfect Copy: the illusion mirrors in full.
    expect(planner.missionIllusionRatio.value).toBe(0.5);

    planner.toggleStartingPower('prism');
    planner.toggleTrainablePower('prism', 1);

    expect(planner.missionIllusionRatio.value).toBe(1);
    expect(totals().vigor).toBe(4 + 1 + 4); // golem + prism + full illusion
  });

  it('clamps each team total at the stat maximum', async () => {
    state.showEp8Recruits.value = true;
    await nextTick();

    planner.fillMissionSlot(0, 'blonde-blazer');
    planner.fillMissionSlot(1, 'phenomaman');

    // * Combat 8 + 7 caps at 10.
    expect(totals().combat).toBe(10);
  });

  it('lists the derived effects for the math panel', () => {
    planner.fillMissionSlot(0, 'coupe');
    planner.fillMissionSlot(1, 'prism');

    expect(planner.missionDerivedEffects.value).toEqual([
      { type: 'en-pointe', stat: 'combat', bonus: 1 },
      { type: 'illusion', source: 'coupe', ratio: 0.5 }
    ]);

    // * Spread Thin lists by its standing copies.
    state.missionSlots.value = [null, null, null, null];
    planner.toggleStartingPower('golem');
    planner.toggleTrainablePower('golem', 1);
    planner.fillMissionSlot(1, 'golem');

    expect(planner.missionDerivedEffects.value).toEqual([
      { type: 'spread-thin', copies: 2 }
    ]);
  });
});

describe('the illusion source', () => {
  it('is the hero standing to Prism’s left', () => {
    planner.fillMissionSlot(0, 'coupe');
    planner.fillMissionSlot(1, 'prism');

    expect(planner.missionIllusionSource.value).toBe('coupe');
  });

  it('is nobody once a copy takes the source’s slot', async () => {
    // * The state the panel's own copy of this rule used to mistype: removing the source
    // * frees its slot, and Golem's copies fill it. Only the watcher keeps it honest.
    if (planner.getPowerState('golem').trainableSelected !== 1) {
      planner.toggleStartingPower('golem');
      planner.toggleTrainablePower('golem', 1);
    }

    planner.fillMissionSlot(1, 'coupe');
    planner.fillMissionSlot(2, 'prism');

    expect(slots()).toEqual([null, 'coupe', 'prism', 'illusion']);

    planner.removeMissionSlot(1);
    planner.fillMissionSlot(0, 'golem');
    await nextTick();

    // * The sanitize watcher runs pre-flush on every slot change, so the illusion is
    // * already gone by the time anything renders — a copy never stands beside Prism
    // * with an illusion to her right.
    expect(slots()).toEqual(['golem', 'copy', 'prism', null]);
    expect(planner.missionIllusionSource.value).toBeNull();
  });
});
