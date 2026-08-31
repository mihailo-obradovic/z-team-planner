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
  it('appears to Prism\'s right when she lands with a hero to her left', () => {
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

  it('owns the threshold columns: 2×XP on #2 only, fail on #3 only, null unsets', () => {
    planner.setMissionThreshold(1, 'xp', 'combat', 7);
    planner.setMissionThreshold(2, 'fail', 'mobility', 8);
    planner.setMissionThreshold(0, 'xp', 'combat', 7);
    planner.setMissionThreshold(1, 'fail', 'combat', 7);
    planner.setMissionThreshold(2, 'fail', 'vigor', 11);

    const templates = state.missionTemplates.value!;

    expect(templates[1]!.xp.combat).toBe(7);
    expect(templates[2]!.fail.mobility).toBe(8);
    expect(templates[0]!.xp).toEqual({});
    expect(templates[1]!.fail).toEqual({});
    expect(templates[2]!.fail.vigor).toBeUndefined();

    planner.setMissionThreshold(1, 'xp', 'combat', null);

    expect(state.missionTemplates.value![1]!.xp.combat).toBeUndefined();
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
