import { MAX_STAT_VALUE } from '@/types/hero';
import {
  ILLUSION_SLOT,
  MISSION_SLOT_COUNT,
  MISSION_TEMPLATE_COUNT
} from '@/types/mission';

import type { HeroId, StatName, SynergyLevel } from '@/types/hero';
import type { MissionSlot } from '@/types/mission';
import type { useHeroEpisodeSetup } from '@/composables/useHeroEpisodeSetup';

// * Feature 015 — the mission team and template state actions. Slots are positional: some
// * powers pay by slot, so order is part of the state, and every write is guarded the way
// * the planner's other actions are (an ineligible call is a silent no-op).
export function useMissionSimulator(
  episodeSetup: ReturnType<typeof useHeroEpisodeSetup>
) {
  const {
    missionSlots,
    missionTemplates,
    missionSynergyLevel,
    missionActiveTemplate
  } = usePlannerState();
  const { visibleHeroes, synergyPairs } = episodeSetup;

  const missionHeroIds = computed<Set<HeroId>>(
    () =>
      new Set(
        missionSlots.value.filter(
          (slot): slot is HeroId => slot !== null && slot !== ILLUSION_SLOT
        )
      )
  );

  // * What the slot picker offers: the current roster, minus heroes already on the team.
  const missionCandidates = computed(() =>
    visibleHeroes.value.filter((hero) => !missionHeroIds.value.has(hero.id))
  );

  // * The synergy switch is meaningful only while the team holds a derived pair; the stored
  // * level survives losing it and re-applies when a pair returns (feature 015).
  const missionTeamHasPair = computed(() =>
    synergyPairs.value.some(
      ([a, b]) => missionHeroIds.value.has(a) && missionHeroIds.value.has(b)
    )
  );

  function fillMissionSlot(index: number, heroId: HeroId) {
    if (!isSlotIndex(index) || missionHeroIds.value.has(heroId)) {
      return;
    }

    if (!visibleHeroes.value.some((hero) => hero.id === heroId)) {
      return;
    }

    const slots = [...missionSlots.value];

    slots[index] = heroId;
    missionSlots.value = heroId === 'prism' ? withIllusion(slots, index) : slots;
  }

  // * Removal is the same for a hero and the illusion — and for the illusion it is sticky:
  // * creation happens only on Prism's placement, so nothing recreates it here.
  function removeMissionSlot(index: number) {
    if (!isSlotIndex(index) || missionSlots.value[index] === null) {
      return;
    }

    const slots = [...missionSlots.value];

    slots[index] = null;
    missionSlots.value = slots;
  }

  function moveMissionSlot(index: number, direction: -1 | 1) {
    const target = index + direction;

    if (
      !isSlotIndex(index) ||
      !isSlotIndex(target) ||
      missionSlots.value[index] === null
    ) {
      return;
    }

    const slots = [...missionSlots.value];
    const moved = slots[index]!;

    slots[index] = slots[target]!;
    slots[target] = moved;

    // * Moving Prism is placing her again — the passive partner of a swap is not placed.
    missionSlots.value =
      moved === 'prism' ? withIllusion(slots, target) : slots;
  }

  function setMissionReq(template: number, stat: StatName, value: number) {
    if (!isTemplateIndex(template) || !isStatValue(value, 0)) {
      return;
    }

    updateTemplate(template, (entry) => ({
      ...entry,
      req: { ...entry.req, [stat]: value }
    }));
  }

  // * Which template owns which column is fixed: 2×XP on #2, fail on #3. `null` unsets.
  function setMissionThreshold(
    template: number,
    kind: 'xp' | 'fail',
    stat: StatName,
    value: number | null
  ) {
    if (template !== (kind === 'xp' ? 1 : 2)) {
      return;
    }

    if (value !== null && !isStatValue(value, 1)) {
      return;
    }

    updateTemplate(template, (entry) => {
      const column = { ...entry[kind] };

      if (value === null) {
        delete column[stat];
      } else {
        column[stat] = value;
      }

      return { ...entry, [kind]: column };
    });
  }

  function setMissionSynergyLevel(level: SynergyLevel) {
    if ([0, 1, 2, 3].includes(level)) {
      missionSynergyLevel.value = level;
    }
  }

  function setMissionActiveTemplate(index: number) {
    if (isTemplateIndex(index)) {
      missionActiveTemplate.value = index;
    }
  }

  function updateTemplate(
    index: number,
    change: (
      entry: NonNullable<typeof missionTemplates.value>[number]
    ) => NonNullable<typeof missionTemplates.value>[number]
  ) {
    const templates = missionTemplates.value;

    if (templates) {
      missionTemplates.value = templates.map((entry, at) =>
        at === index ? change(entry) : entry
      );
    }
  }

  // * Slot validity is enforced continuously, creation only on placement: a hidden hero
  // * (episode change, or a stale document) leaves the team, and the illusion survives only
  // * in its exact context — directly to Prism's right, with a hero to her left. This same
  // * watcher is what drops contextless entries after deserialization.
  watch(
    [missionSlots, visibleHeroes],
    () => {
      const cleaned = sanitize(missionSlots.value, visibleHeroes.value);

      if (cleaned.some((slot, index) => slot !== missionSlots.value[index])) {
        missionSlots.value = cleaned;
      }
    },
    { immediate: true }
  );

  return {
    missionSlots,
    missionTemplates,
    missionSynergyLevel,
    missionActiveTemplate,
    missionHeroIds,
    missionCandidates,
    missionTeamHasPair,
    fillMissionSlot,
    removeMissionSlot,
    moveMissionSlot,
    setMissionReq,
    setMissionThreshold,
    setMissionSynergyLevel,
    setMissionActiveTemplate
  };
}

function isSlotIndex(value: number): boolean {
  return Number.isInteger(value) && value >= 0 && value < MISSION_SLOT_COUNT;
}

function isTemplateIndex(value: number): boolean {
  return (
    Number.isInteger(value) && value >= 0 && value < MISSION_TEMPLATE_COUNT
  );
}

function isStatValue(value: number, min: number): boolean {
  return Number.isInteger(value) && value >= min && value <= MAX_STAT_VALUE;
}

function isHeroSlot(slot: MissionSlot): slot is HeroId {
  return slot !== null && slot !== ILLUSION_SLOT;
}

// * Prism was just placed at `index`: the illusion of her left neighbor appears in the slot
// * to her right when that slot is free — slot 1 has no left neighbor, slot 4 no right slot.
function withIllusion(slots: MissionSlot[], index: number): MissionSlot[] {
  const right = index + 1;

  if (
    right < MISSION_SLOT_COUNT &&
    slots[right] === null &&
    isHeroSlot(slots[index - 1] ?? null)
  ) {
    const next = [...slots];

    next[right] = ILLUSION_SLOT;

    return next;
  }

  return slots;
}

function sanitize(
  slots: MissionSlot[],
  visible: { id: HeroId }[]
): MissionSlot[] {
  const visibleIds = new Set(visible.map((hero) => hero.id));
  const heroesOnly = slots.map((slot) =>
    isHeroSlot(slot) && !visibleIds.has(slot) ? null : slot
  );
  const prism = heroesOnly.indexOf('prism');

  return heroesOnly.map((slot, index) =>
    slot === ILLUSION_SLOT &&
    !(
      prism > 0 &&
      index === prism + 1 &&
      isHeroSlot(heroesOnly[prism - 1] ?? null)
    )
      ? null
      : slot
  );
}
