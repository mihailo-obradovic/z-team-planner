<template>
  <!-- * `chip-leaving` takes a departing chip out of flow so the chips that stay travel under `chip-move`. -->
  <!-- * The span is the keyed element because `TooltipButton` renders a fragment a transition cannot animate. -->
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
        @click="handleToggleStartingPower"
      />
    </span>

    <span
      v-for="(power, index) in upgradePowers"
      :key="`trainable-${index}`"
      class="flex"
    >
      <TooltipButton
        :text="`${power.name}: ${power.description}`"
        :icon="POWER_ICONS[index + 1]!"
        :color="trainablePowerActive(index) ? 'primary' : 'neutral'"
        :active="trainablePowerActive(index)"
        :disabled="isTrainableDisabled(index)"
        :confirmation="
          () =>
            confirmationText({
              kind: 'upgrade',
              name: power.name,
              trained: trainablePowerActive(index)
            })
        "
        @click="() => handleToggleTrainablePower(index)"
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
        @click="handleToggleSpecialPower"
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
        @click="handleToggleSpecialPower"
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
        @click="handleToggleSpecialPower"
      />
    </span>
  </TransitionGroup>
</template>

<script setup lang="ts">
import {
  HERO_POWERS,
  MAX_POWER_TRAININGS,
  SPECIAL_POWER_MECHANICS
} from '@/types/hero';

import type { HeroId, HeroPowerDefinition } from '@/types/hero';

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

// * Episode 8 arrivals never had training, so they have no upgrades.
const upgradePowers = computed((): HeroPowerDefinition[] => {
  if (!powers.value || ep8RecruitIds.value.has(props.heroId)) {
    return [];
  }

  return powers.value.slice(1);
});

function trainablePowerActive(index: number) {
  return powerStates.value.trainableSelected === index + 1;
}

function isTrainableDisabled(index: number) {
  return (
    !powerStates.value.startingRevealed ||
    (powerStates.value.trainableSelected !== index + 1 && trainingsFull.value)
  );
}

function handleToggleStartingPower() {
  toggleStartingPower(props.heroId);
}

function handleToggleTrainablePower(index: number) {
  toggleTrainablePower(props.heroId, (index + 1) as 1 | 2);
}

function handleToggleSpecialPower() {
  toggleSpecialPower(props.heroId);
}

const showFlambaeSupernova = computed(
  () => props.heroId === 'flambae' && powerStates.value.trainableSelected === 2
);

const showCoupeEnPointe = computed(
  () => props.heroId === 'coupe' && powerStates.value.startingRevealed
);

const coupeBonus = computed(() =>
  powerStates.value.trainableSelected === 2
    ? SPECIAL_POWER_MECHANICS.coupe.upgradeBonus
    : SPECIAL_POWER_MECHANICS.coupe.baseBonus
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

const showGolemSpreadThin = computed(
  () => props.heroId === 'golem' && powerStates.value.trainableSelected === 1
);

// * Labelled by slot count, since slots are what the player picks at dispatch.
const golemTooltip = computed(() => {
  const slots = specialPowerState.value;

  if (slots === 0) {
    return 'Spread Thin: Click to fill 1–3 empty slots';
  }

  const percent = slots * SPECIAL_POWER_MECHANICS.golem.percentPerSlot * 100;

  return `Spread Thin: +${slots} slot${slots > 1 ? 's' : ''} (+${percent}%)`;
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

const sonarFormIcon = computed(() =>
  monsterForm.value ? 'i-lucide-zap' : 'i-lucide-user'
);

const sonarFormTooltip = computed(() =>
  monsterForm.value ? 'Mega Bat Form' : 'Hybrid Form'
);
</script>
