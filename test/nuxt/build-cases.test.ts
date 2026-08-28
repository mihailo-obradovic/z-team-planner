import { readFileSync } from 'node:fs';
import { beforeAll, describe, expect, it } from 'vitest';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import { defineComponent, h, nextTick } from 'vue';

import { DEFAULT_EP3_CUT, DEFAULT_EP4_HIRE, STAT_NAMES } from '@/types/hero';
import type { HeroId, HeroPowerSelection, HeroStats } from '@/types/hero';
import type { SerializedBuild } from '@/types/build';

// * The other half of shared/build-cases.json: tests/services/test_validation.py holds the server to these verdicts, and this file holds the planner to them. A document the server rejects must be one the planner's guards cannot produce, or a user could build something their account refuses to save.

type Case = {
  name: string;
  tier: string;
  data: SerializedBuild;
  valid: boolean;
  paths?: string[];
};

const { cases } = JSON.parse(
  readFileSync('shared/build-cases.json', 'utf8')
) as { cases: Case[] };

// * Structure failures (an unknown key, a null, v: 2) have no planner state to replay — they are shapes the serializer cannot emit at all. The server test is where those are proven.
const replayable = cases.filter((testCase) => testCase.tier !== 'structure');

type Planner = ReturnType<typeof useHeroPlanner>;
type State = {
  levelUps: Ref<Partial<Record<HeroId, HeroStats>>>;
  bonusLevels: Ref<Partial<Record<HeroId, number>>>;
  powers: Ref<Partial<Record<HeroId, HeroPowerSelection>>>;
  specialPowers: Ref<Partial<Record<HeroId, number>>>;
  flights: Ref<Partial<Record<HeroId, boolean>>>;
};

let planner!: Planner;
let state!: State;

beforeAll(async () => {
  await mountSuspended(
    defineComponent({
      setup() {
        planner = useHeroPlanner();
        state = {
          levelUps: useState('heroLevelUps'),
          bonusLevels: useState('heroBonusLevels'),
          powers: useState('heroPowers'),
          specialPowers: useState('heroSpecialPowers'),
          flights: useState('heroFlights')
        };

        return () => h('div');
      }
    })
  );
});

// * The value an episode select could actually emit, or `undefined` if it is not one of its items.
function choose(
  items: { value: string }[],
  wanted: string | undefined
): HeroId | undefined {
  return items.some((item) => item.value === wanted)
    ? (wanted as HeroId)
    : undefined;
}

// * Drive the planner the way the interface does, then serialize what came out.
// * Only guarded actions are called — never a direct write to the state refs — because the guards are exactly what this test is about. Clearing between cases is setup, not behavior, so that part does assign the refs.
async function replay(document: SerializedBuild): Promise<SerializedBuild> {
  state.levelUps.value = {};
  state.bonusLevels.value = {};
  state.powers.value = {};
  state.specialPowers.value = {};
  state.flights.value = {};

  // * Episode choices first, exactly as deserialization does: the sub-composables' watchers clear cut and non-hired heroes on the next tick and would otherwise wipe what follows. Each select can only emit one of its own items, so a hero outside that list is not a choice the interface offers — the ref itself is unguarded, the control is the guard.
  planner.ep3Cut.value =
    choose(planner.ep3CutItems.value, document.ec) ?? DEFAULT_EP3_CUT;
  planner.ep4Hire.value =
    choose(planner.ep4HireItems.value, document.eh) ?? DEFAULT_EP4_HIRE;
  planner.showEp8Recruits.value = document.e8 === 1;

  await nextTick();

  const visible = new Set(planner.visibleHeroes.value.map((hero) => hero.id));

  const mentioned = new Set<string>([
    ...Object.keys(document.lu ?? {}),
    ...Object.keys(document.bl ?? {}),
    ...Object.keys(document.pw ?? {}),
    ...Object.keys(document.sp ?? {}),
    ...(document.fl ?? [])
  ]);

  for (const raw of mentioned) {
    const id = raw as HeroId;

    // * A hero with no card has no controls — the cut hero, and recruits while episode 8 is off.
    if (!visible.has(id)) continue;

    // * Bonus levels before stats: they raise the cap statUp checks against.
    for (let i = 0; i < (document.bl?.[id] ?? 0); i++) {
      planner.addBonusLevel(id);
    }

    const allocations = document.lu?.[id] ?? [];

    STAT_NAMES.forEach((stat, index) => {
      for (let i = 0; i < (allocations[index] ?? 0); i++) {
        planner.statUp(id, stat);
      }
    });

    const [revealed, trained] = document.pw?.[id] ?? [0, 0];

    if (revealed === 1) planner.toggleStartingPower(id);
    if (trained === 1 || trained === 2) {
      planner.toggleTrainablePower(id, trained);
    }

    for (let i = 0; i < (document.sp?.[id] ?? 0); i++) {
      planner.toggleSpecialPower(id);
    }
  }

  // * Flight School is its own action, and `fl` is serialized in training order — so the document's own order is replayed, and it decides which hero the two-training cap refuses.
  for (const raw of document.fl ?? []) {
    const id = raw as HeroId;

    if (visible.has(id)) planner.toggleFlight(id);
  }

  return planner.serializeCurrentBuild();
}

function rows(valid: boolean) {
  return replayable
    .filter((testCase) => testCase.valid === valid)
    .map((testCase) => [testCase.name, testCase] as const);
}

describe('a document the server accepts', () => {
  it.each(rows(true))('is one the planner reaches: %s', async (_name, test) => {
    // * Exact equality, key for key: the server stores what it validated and returns it unchanged, so a document the planner cannot reproduce is one no user could have made.
    expect(await replay(test.data)).toEqual(test.data);
  });
});

describe('a document the server rejects', () => {
  it.each(rows(false))(
    'is one the planner refuses: %s',
    async (_name, test) => {
      // ! The load-bearing half. If this ever fails, the planner can build something the account will not store — fix the guard, never the case.
      expect(await replay(test.data)).not.toEqual(test.data);
    }
  );
});
