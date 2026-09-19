import { SPECIAL_POWER_MECHANICS } from '@/types/hero';

import type { HeroId, HeroSpecialPower } from '@/types/hero';

// * The one reading of a hero's special power, so the card's chip row and the detail dialog's panel cannot drift (feature 012). Each surface takes what it needs from the same description: the chips render a power once `revealed`, the panel renders it always and greys it while `locked`.
export function useHeroSpecialPower(heroId: MaybeRefOrGetter<HeroId | null>) {
  const { getPowerState, getSpecialPowerState } = useHeroPlanner();

  const id = computed(() => toValue(heroId));

  const specialPower = computed<HeroSpecialPower | null>(() => {
    const hero = id.value;

    if (!hero) {
      return null;
    }

    const mechanics =
      SPECIAL_POWER_MECHANICS[hero as keyof typeof SPECIAL_POWER_MECHANICS];

    if (!mechanics) {
      return null;
    }

    const state = getSpecialPowerState(hero);
    const powerState = getPowerState(hero);
    const face = { state, active: state > 0 };

    if (mechanics.type === 'supernova') {
      const description = 'Combat and Mobility set to 10 after two successes.';
      const trained = powerState.trainableSelected === 2;

      return {
        kind: 'supernova',
        name: 'Supernova',
        icon: 'i-lucide-flame',
        locked: !trained,
        revealed: trained,
        description,
        descriptionVariants: [description],
        chipTooltip: 'Supernova: Set Combat and Mobility to 10',
        ...face
      };
    }

    if (mechanics.type === 'en-pointe') {
      const bonus =
        powerState.trainableSelected === 2
          ? mechanics.upgradeBonus
          : mechanics.baseBonus;
      const icon = enPointeIcon(state);

      return {
        kind: 'en-pointe',
        name: 'En Pointe',
        icon,
        swapKey: icon,
        bonus,
        // ! Never locked: her trainables resize the bonus rather than gate it, and revealing the starting power is what puts the chip on the card.
        locked: false,
        revealed: powerState.startingRevealed,
        description: enPointeDescription(bonus, state),
        descriptionVariants: [0, 1, 2].map((each) =>
          enPointeDescription(bonus, each)
        ),
        chipTooltip: enPointeTooltip(bonus, state),
        ...face
      };
    }

    const trained = powerState.trainableSelected === 1;
    const slots = Array.from({ length: mechanics.max + 1 }, (_, each) => each);

    return {
      kind: 'spread-thin',
      name: 'Spread Thin',
      icon: 'i-lucide-expand',
      locked: !trained,
      revealed: trained,
      description: spreadThinDescription(state),
      descriptionVariants: slots.map(spreadThinDescription),
      chipTooltip: spreadThinTooltip(state),
      ...face
    };
  });

  // * Called after the click rather than read from the descriptor, so the line names the state the press produced (feature 018).
  function specialPowerConfirmation(): string | null {
    const power = specialPower.value;

    if (!power) {
      return null;
    }

    if (power.kind === 'supernova') {
      return confirmationText({ kind: 'supernova', on: power.active });
    }

    if (power.kind === 'en-pointe') {
      return confirmationText({
        kind: 'en-pointe',
        state: power.state as 0 | 1 | 2,
        bonus: power.bonus
      });
    }

    return confirmationText({
      kind: 'spread-thin',
      slots: power.state as 0 | 1 | 2 | 3
    });
  }

  return { specialPower, specialPowerConfirmation };
}

function enPointeIcon(state: number): string {
  if (state === 1) {
    return 'i-lucide-sword';
  }

  if (state === 2) {
    return 'i-lucide-footprints';
  }

  return 'i-lucide-sparkles';
}

// * One source for the shown line and the reserved variants, so a state cannot render taller than the row kept for it.
function enPointeDescription(bonus: number, state: number): string {
  const statLabel =
    state === 1 ? 'Combat' : state === 2 ? 'Mobility' : 'Combat or Mobility';

  return `+${bonus} ${statLabel} when placed in a specific slot.`;
}

function enPointeTooltip(bonus: number, state: number): string {
  if (state === 1) {
    return `En Pointe: +${bonus} Combat (active)`;
  }

  if (state === 2) {
    return `En Pointe: +${bonus} Mobility (active)`;
  }

  return `En Pointe: Click to activate +${bonus} Combat or Mobility`;
}

function spreadThinDescription(state: number): string {
  if (state === 0) {
    return 'Expands into each empty slot, raising every stat 25% per slot.';
  }

  const slots = state === 1 ? '1 slot' : `${state} slots`;
  const percent = state * SPECIAL_POWER_MECHANICS.golem.percentPerSlot * 100;

  return `Expanded into ${slots} — every stat up ${percent}%.`;
}

// * Labelled by slot count, since slots are what the player picks at dispatch.
function spreadThinTooltip(state: number): string {
  if (state === 0) {
    return 'Spread Thin: Click to fill 1–3 empty slots';
  }

  const percent = state * SPECIAL_POWER_MECHANICS.golem.percentPerSlot * 100;

  return `Spread Thin: +${state} slot${state > 1 ? 's' : ''} (+${percent}%)`;
}
