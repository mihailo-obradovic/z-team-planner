<template>
  <!-- * A chip comes and goes with the state fade, and its neighbours travel under the list move (annex §11, feature 024). The row is centre-justified, so an arriving chip shifts every other one; `chip-leaving` takes a departing chip out of flow so its neighbours travel while it fades rather than after, and `relative` is what it is then positioned against. A chip arriving or leaving only fades, in place: the travel belongs to the chips that stay. Each chip's span is the group's keyed element: `TooltipButton` renders a fragment (the tooltip's renderless root), which a transition cannot animate. -->
  <TransitionGroup
    v-if="powers"
    tag="div"
    name="state-fade"
    move-class="chip-move"
    enter-active-class="chip-entering"
    leave-active-class="chip-leaving"
    @beforeLeave="pinLeaving"
    class="relative flex h-6 items-center justify-center gap-1"
  >
    <span v-if="heroId === 'sonar'" key="sonar-form" class="flex">
      <TooltipButton
        :text="sonarFormTooltip"
        :icon="sonarFormIcon"
        :swap-key="sonarFormIcon"
        :color="monsterForm ? 'primary' : 'neutral'"
        :active="monsterForm"
        :confirmation="
          () =>
            confirmationText({
              kind: 'monster-form',
              form: monsterForm ? 'mega-bat' : 'hybrid'
            })
        "
        @click="toggleMonsterForm"
      />
    </span>

    <span key="starting" class="flex">
      <TooltipButton
        :text="`${powers[0]!.name}: ${powers[0]!.description}`"
        :icon="POWER_ICONS[0]"
        :color="powerStates.startingRevealed ? 'primary' : 'neutral'"
        :active="powerStates.startingRevealed"
        :confirmation="
          () =>
            confirmationText({
              kind: 'starting',
              name: powers![0]!.name,
              revealed: powerStates.startingRevealed
            })
        "
        @click="toggleStartingPower(heroId)"
      />
    </span>

    <span
      v-for="(power, i) in upgradePowers"
      :key="`trainable-${i}`"
      class="flex"
    >
      <TooltipButton
        :text="`${power.name}: ${power.description}`"
        :icon="POWER_ICONS[i + 1]!"
        :color="trainablePowerColor(i)"
        :active="trainablePowerActive(i)"
        :disabled="isTrainableDisabled(i)"
        :confirmation="
          () =>
            confirmationText({
              kind: 'upgrade',
              name: power.name,
              trained: trainablePowerActive(i)
            })
        "
        @click="toggleTrainablePower(heroId, (i + 1) as 1 | 2)"
      />
    </span>

    <span v-if="showFlambaeSupernova" key="supernova" class="flex">
      <TooltipButton
        text="Supernova: Set Combat and Mobility to 10"
        icon="i-lucide-flame"
        :color="specialPowerState ? 'primary' : 'neutral'"
        :active="specialPowerState > 0"
        :confirmation="
          () =>
            confirmationText({ kind: 'supernova', on: specialPowerState > 0 })
        "
        @click="toggleSpecialPower(heroId)"
      />
    </span>

    <span v-if="showCoupeEnPointe" key="en-pointe" class="flex">
      <TooltipButton
        :text="coupeTooltip"
        :icon="coupeIcon"
        :swap-key="coupeIcon"
        :color="specialPowerState ? 'primary' : 'neutral'"
        :active="specialPowerState > 0"
        :confirmation="
          () =>
            confirmationText({
              kind: 'en-pointe',
              state: specialPowerState as 0 | 1 | 2,
              bonus: coupeBonus
            })
        "
        @click="toggleSpecialPower(heroId)"
      />
    </span>

    <span v-if="showGolemSpreadThin" key="spread-thin" class="flex">
      <TooltipButton
        :text="golemTooltip"
        icon="i-lucide-expand"
        :color="specialPowerState ? 'primary' : 'neutral'"
        :active="specialPowerState > 0"
        :confirmation="
          () =>
            confirmationText({
              kind: 'spread-thin',
              slots: specialPowerState as 0 | 1 | 2 | 3
            })
        "
        @click="toggleSpecialPower(heroId)"
      />
    </span>
  </TransitionGroup>
</template>

<script setup lang="ts">
// * A leaving chip is taken out of flow so its neighbours can travel while it fades rather than after.
// ! Its offsets have to be pinned first. An absolutely positioned child of a centred flex row is placed
// ! by that centring, not by where it stood, so without this the chip jumps to the middle of the row,
// ! overlaps the chips that remain, and fades out there. Read in `beforeLeave`, which runs while the
// ! chip is still in flow — one frame later `chip-leaving` has already moved it.
function pinLeaving(element: Element) {
  const chip = element as HTMLElement;

  chip.style.left = `${chip.offsetLeft}px`;
  chip.style.top = `${chip.offsetTop}px`;
}

import { confirmationText } from '@/utils/confirmationText';
import { HERO_POWERS, MAX_POWER_TRAININGS } from '@/types/hero';

import type { HeroId, HeroPowerDefinition } from '@/types/hero';

const POWER_ICONS = [
  'i-lucide-zap',
  'i-lucide-shield',
  'i-lucide-swords'
] as const;

const props = defineProps<{
  heroId: HeroId;
}>();

const {
  getPowerState,
  toggleStartingPower,
  toggleTrainablePower,
  trainingsUsed,
  ep8RecruitIds,
  getSpecialPowerState,
  toggleSpecialPower,
  monsterForm,
  toggleMonsterForm
} = useHeroPlanner();

const powerStates = computed(() => getPowerState(props.heroId));

const specialPowerState = computed(() => getSpecialPowerState(props.heroId));

const trainingsFull = computed(
  () => trainingsUsed.value >= MAX_POWER_TRAININGS
);

const powers = computed(() => HERO_POWERS[props.heroId]);

// * An episode 8 arrival never had training available, so there are no upgrades to offer.
const upgradePowers = computed((): HeroPowerDefinition[] => {
  if (!powers.value || ep8RecruitIds.value.has(props.heroId)) {
    return [];
  }
  return powers.value.slice(1);
});

function trainablePowerColor(i: number) {
  return trainablePowerActive(i) ? 'primary' : 'neutral';
}

function trainablePowerActive(i: number) {
  return powerStates.value.trainableSelected === i + 1;
}

function isTrainableDisabled(i: number) {
  return (
    !powerStates.value.startingRevealed ||
    (powerStates.value.trainableSelected !== i + 1 && trainingsFull.value)
  );
}

const showFlambaeSupernova = computed(() => {
  return (
    props.heroId === 'flambae' && powerStates.value.trainableSelected === 2
  );
});

const showCoupeEnPointe = computed(() => {
  return props.heroId === 'coupe' && powerStates.value.startingRevealed;
});

const coupeBonus = computed(() =>
  powerStates.value.trainableSelected === 2 ? 3 : 1
);

const coupeTooltip = computed(() => {
  const bonus = `+${coupeBonus.value}`;

  if (specialPowerState.value === 1) {
    return `En Pointe: ${bonus} Combat (active)`;
  }
  if (specialPowerState.value === 2) {
    return `En Pointe: ${bonus} Mobility (active)`;
  }
  return `En Pointe: Click to activate ${bonus} Combat or Mobility`;
});

const showGolemSpreadThin = computed(() => {
  return props.heroId === 'golem' && powerStates.value.trainableSelected === 1;
});

// * Labelled by slot count rather than percentage: slots are what the player picks at the dispatch screen, the percentage is only the mechanism.
const golemTooltip = computed(() => {
  const slots = specialPowerState.value;

  if (slots === 0) {
    return 'Spread Thin: Click to fill 1–3 empty slots';
  }

  return `Spread Thin: +${slots} slot${slots > 1 ? 's' : ''} (+${slots * 25}%)`;
});

const coupeIcon = computed(() => {
  if (specialPowerState.value === 1) {
    return 'i-lucide-sword';
  }
  if (specialPowerState.value === 2) {
    return 'i-lucide-footprints';
  }
  return 'i-lucide-sparkles';
});

const sonarFormIcon = computed(() => {
  return monsterForm.value ? 'i-lucide-zap' : 'i-lucide-user';
});

const sonarFormTooltip = computed(() => {
  return monsterForm.value ? 'Mega Bat Form' : 'Hybrid Form';
});
</script>
