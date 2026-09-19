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
        :confirmation="monsterFormConfirmation"
        @click="toggleMonsterForm"
      />
    </span>

    <span key="starting" class="flex">
      <TooltipButton
        :text="startingTooltip"
        :icon="POWER_ICONS[0]"
        :color="powerStates.startingRevealed ? 'primary' : 'neutral'"
        :active="powerStates.startingRevealed"
        :confirmation="startingConfirmation"
        @click="handleToggleStartingPower"
      />
    </span>

    <span
      v-for="(power, index) in upgradePowers"
      :key="`trainable-${index}`"
      class="flex"
    >
      <TooltipButton
        :text="powerTooltip(power)"
        :icon="POWER_ICONS[index + 1]!"
        :color="trainablePowerActive(index) ? 'primary' : 'neutral'"
        :active="trainablePowerActive(index)"
        :disabled="trainablesLocked"
        :confirmation="() => upgradeConfirmation(power, index)"
        @click="() => handleToggleTrainablePower(index)"
      />
    </span>

    <span v-if="specialPower?.revealed" :key="specialPower.kind" class="flex">
      <TooltipButton
        :text="specialPower.chipTooltip"
        :icon="specialPower.icon"
        :swap-key="specialPower.swapKey"
        :color="specialPower.active ? 'primary' : 'neutral'"
        :active="specialPower.active"
        :confirmation="specialPowerConfirmation"
        @click="handleToggleSpecialPower"
      />
    </span>
  </TransitionGroup>
</template>

<script setup lang="ts">
import { HERO_POWERS } from '@/types/hero';

import type { HeroId, HeroPowerDefinition } from '@/types/hero';

const props = defineProps<{
  heroId: HeroId;
}>();

const {
  getPowerState,
  toggleStartingPower,
  toggleTrainablePower,
  ep8RecruitIds,
  toggleSpecialPower,
  monsterForm,
  toggleMonsterForm
} = useHeroPlanner();

const { trainablesLocked } = useHeroDerived(() => props.heroId);

const { specialPower, specialPowerConfirmation } = useHeroSpecialPower(
  () => props.heroId
);

const powerStates = computed(() => getPowerState(props.heroId));

const powers = computed(() => HERO_POWERS[props.heroId]);

// * Episode 8 arrivals never had training, so they have no upgrades.
const upgradePowers = computed((): HeroPowerDefinition[] => {
  if (!powers.value || ep8RecruitIds.value.has(props.heroId)) {
    return [];
  }

  return powers.value.slice(1);
});

// * Upgrade powers follow the starting power, so list position 0 is trainable slot 1.
function trainableSlot(index: number): 1 | 2 {
  return index === 0 ? 1 : 2;
}

const sonarFormIcon = computed(() =>
  monsterForm.value ? 'i-lucide-zap' : 'i-lucide-user'
);

const sonarFormTooltip = computed(() =>
  monsterForm.value ? 'Mega Bat Form' : 'Hybrid Form'
);

function monsterFormConfirmation(): string | null {
  return confirmationText({
    kind: 'monster-form',
    form: monsterForm.value ? 'mega-bat' : 'hybrid'
  });
}

const startingTooltip = computed(() => powerTooltip(powers.value?.[0]));

function startingConfirmation(): string | null {
  return confirmationText({
    kind: 'starting',
    name: powers.value?.[0]?.name ?? '',
    revealed: powerStates.value.startingRevealed
  });
}

function powerTooltip(power: HeroPowerDefinition | undefined): string {
  return power ? `${power.name}: ${power.description}` : '';
}

function upgradeConfirmation(
  power: HeroPowerDefinition,
  index: number
): string | null {
  return confirmationText({
    kind: 'upgrade',
    name: power.name,
    trained: trainablePowerActive(index)
  });
}

function trainablePowerActive(index: number) {
  return powerStates.value.trainableSelected === trainableSlot(index);
}

function handleToggleStartingPower() {
  toggleStartingPower(props.heroId);
}

function handleToggleTrainablePower(index: number) {
  toggleTrainablePower(props.heroId, trainableSlot(index));
}

function handleToggleSpecialPower() {
  toggleSpecialPower(props.heroId);
}
</script>
