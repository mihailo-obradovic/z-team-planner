<template>
  <div v-if="powers" class="flex h-6 items-center justify-center gap-1">
    <TooltipButton
      v-if="heroId === 'sonar'"
      :text="sonarFormTooltip"
      :icon="sonarFormIcon"
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

    <TooltipButton
      v-for="(power, i) in upgradePowers"
      :key="i"
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

    <TooltipButton
      v-if="showFlambaeSupernova"
      text="Supernova: Set Combat and Mobility to 10"
      icon="i-lucide-flame"
      :color="specialPowerState ? 'primary' : 'neutral'"
      :active="specialPowerState > 0"
      :confirmation="
        () => confirmationText({ kind: 'supernova', on: specialPowerState > 0 })
      "
      @click="toggleSpecialPower(heroId)"
    />

    <TooltipButton
      v-if="showCoupeEnPointe"
      :text="coupeTooltip"
      :icon="coupeIcon"
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

    <TooltipButton
      v-if="showGolemSpreadThin"
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
  </div>
</template>

<script setup lang="ts">
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
