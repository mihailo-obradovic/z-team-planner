import { GOLEM_COPY_SLOT, ILLUSION_SLOT } from '@/types/mission';

import {
  illusionSource,
  isHeroSlot,
  isRightmostCopy,
  isSlotIndex,
  sanitizeSlots,
  withSpawns
} from '@/utils/missionTeam';

import type { HeroId } from '@/types/hero';
import type { SlotPowerTraining } from '@/types/mission';

// * Slots are positional because some powers pay by slot, and every write is guarded like the planner's other actions: an ineligible call is a silent no-op (feature 015).
export function useMissionTeam(
  episodeSetup: ReturnType<typeof useHeroEpisodeSetup>,
  powerTraining: ReturnType<typeof useHeroPowerTraining>
) {
  const { missionSlots } = usePlannerState();
  const { visibleHeroes, synergyPairs } = episodeSetup;

  const missionHeroIds = computed<Set<HeroId>>(
    () => new Set(missionSlots.value.filter(isHeroSlot))
  );

  const missionCandidates = computed(() =>
    visibleHeroes.value.filter((hero) => !missionHeroIds.value.has(hero.id))
  );

  const missionTeamHasPair = computed(() =>
    synergyPairs.value.some(
      ([a, b]) => missionHeroIds.value.has(a) && missionHeroIds.value.has(b)
    )
  );

  const missionCopyCount = computed(
    () => missionSlots.value.filter((slot) => slot === GOLEM_COPY_SLOT).length
  );

  // * Null only for the instant before the sanitize watcher removes an illusion without a source.
  const missionIllusionSource = computed<HeroId | null>(() =>
    missionSlots.value.includes(ILLUSION_SLOT)
      ? illusionSource(missionSlots.value)
      : null
  );

  function fillMissionSlot(index: number, heroId: HeroId) {
    if (!isSlotIndex(index) || missionHeroIds.value.has(heroId)) {
      return;
    }

    if (
      missionSlots.value[index] === GOLEM_COPY_SLOT &&
      !isRightmostCopy(missionSlots.value, index)
    ) {
      return;
    }

    if (!visibleHeroes.value.some((hero) => hero.id === heroId)) {
      return;
    }

    const slots = [...missionSlots.value];

    slots[index] = heroId;
    missionSlots.value = withSpawns(slots, heroId, index, spreadThinTraining());
  }

  // * Removing a spawned occupant is sticky: only its owner's placement creates one, so nothing recreates it here.
  function removeMissionSlot(index: number) {
    if (!isSlotIndex(index) || missionSlots.value[index] === null) {
      return;
    }

    if (
      missionSlots.value[index] === GOLEM_COPY_SLOT &&
      !isRightmostCopy(missionSlots.value, index)
    ) {
      return;
    }

    const slots = [...missionSlots.value];

    slots[index] = null;
    missionSlots.value = slots;
  }

  function moveMissionSlot(index: number, direction: -1 | 1) {
    const target = index + direction;
    const moved = missionSlots.value[index] ?? null;

    if (!isSlotIndex(index) || !isSlotIndex(target) || !isHeroSlot(moved)) {
      return;
    }

    const slots = [...missionSlots.value];

    slots[index] = slots[target]!;
    slots[target] = moved;

    // * Moving a hero is placing them again — the passive partner of a swap is not placed.
    missionSlots.value = withSpawns(slots, moved, target, spreadThinTraining());
  }

  function spreadThinTraining(): SlotPowerTraining {
    return powerTraining.getPowerState('golem').trainableSelected === 1
      ? 'trained'
      : 'untrained';
  }

  // * The same watcher runs after an episode change or a load, because those can hide a placed hero or strand a spawned occupant.
  watch(
    [
      missionSlots,
      visibleHeroes,
      () => powerTraining.getPowerState('golem').trainableSelected
    ],
    () => {
      const cleaned = sanitizeSlots(
        missionSlots.value,
        new Set(visibleHeroes.value.map((hero) => hero.id)),
        spreadThinTraining()
      );

      if (cleaned.some((slot, index) => slot !== missionSlots.value[index])) {
        missionSlots.value = cleaned;
      }
    },
    { immediate: true }
  );

  return {
    missionSlots,
    missionHeroIds,
    missionCandidates,
    missionTeamHasPair,
    missionCopyCount,
    missionIllusionSource,
    fillMissionSlot,
    removeMissionSlot,
    moveMissionSlot
  };
}
