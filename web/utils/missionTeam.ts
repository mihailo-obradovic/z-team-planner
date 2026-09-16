import {
  GOLEM_COPY_SLOT,
  ILLUSION_SLOT,
  MISSION_SLOT_COUNT
} from '@/types/mission';

import type { HeroId } from '@/types/hero';
import type { MissionSlot, SlotPowerTraining } from '@/types/mission';

// * Placing Prism spawns her left neighbor's illusion in a free slot to her right; placing Golem with Spread Thin trained fills every free slot to his right with copies (feature 015).
export function withSpawns(
  slots: MissionSlot[],
  placed: HeroId,
  index: number,
  spreadThin: SlotPowerTraining
): MissionSlot[] {
  if (placed === 'prism') {
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

  if (placed === 'golem' && spreadThin === 'trained') {
    return slots.map((slot, at) =>
      at > index && slot === null ? GOLEM_COPY_SLOT : slot
    );
  }

  return slots;
}

// * Validity is enforced continuously but creation only on placement, so this drops a hidden hero or a contextless spawned occupant and never adds one.
export function sanitizeSlots(
  slots: MissionSlot[],
  visibleIds: Set<HeroId>,
  spreadThin: SlotPowerTraining
): MissionSlot[] {
  const heroesOnly = slots.map((slot) =>
    isHeroSlot(slot) && !visibleIds.has(slot) ? null : slot
  );
  const golem = heroesOnly.indexOf('golem');

  return heroesOnly.map((slot, index) => {
    if (
      slot === ILLUSION_SLOT &&
      !(index === heroesOnly.indexOf('prism') + 1 && illusionSource(heroesOnly))
    ) {
      return null;
    }

    // * A copy stands only to Golem's right, and only while Spread Thin is trained.
    if (
      slot === GOLEM_COPY_SLOT &&
      !(spreadThin === 'trained' && golem >= 0 && index > golem)
    ) {
      return null;
    }

    return slot;
  });
}

// * The hero Prism's illusion mirrors: her left neighbor, when there is one.
export function illusionSource(slots: MissionSlot[]): HeroId | null {
  const prism = slots.indexOf('prism');
  const source = prism > 0 ? slots[prism - 1] : null;

  return isHeroSlot(source ?? null) ? (source as HeroId) : null;
}

// * A copy dissolves right-to-left, so only the rightmost one can be removed or overwritten.
export function isRightmostCopy(slots: MissionSlot[], index: number): boolean {
  return slots.lastIndexOf(GOLEM_COPY_SLOT) === index;
}

export function isHeroSlot(slot: MissionSlot): slot is HeroId {
  return slot !== null && slot !== ILLUSION_SLOT && slot !== GOLEM_COPY_SLOT;
}

export function isSlotIndex(value: number): boolean {
  return Number.isInteger(value) && value >= 0 && value < MISSION_SLOT_COUNT;
}
