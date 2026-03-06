<template>
  <div :class="containerClass">
    <u-form-field label="Episode 3: Cut" orientation="horizontal">
      <u-select v-model="ep3Cut" :items="ep3CutItems" variant="subtle" />
    </u-form-field>

    <u-form-field label="Episode 4: Hire" orientation="horizontal">
      <u-select v-model="ep4Hire" :items="ep4HireItems" variant="subtle" />
    </u-form-field>

    <u-form-field
      label="Episode 8 recruits"
      orientation="horizontal"
      :class="ep8SwitchClass"
    >
      <u-switch v-model="showEp8Recruits" size="sm" />
    </u-form-field>

    <div :class="counterClass">
      <span class="text-sm text-muted">
        Power trainings: {{ trainingsUsed }}/{{ MAX_POWER_TRAININGS }}
      </span>
      <IconButton
        v-if="trainingsUsed > 0"
        icon="i-lucide-rotate-ccw"
        color="neutral"
        @click="resetAllPowerTrainings"
      />
    </div>
    <div :class="counterClass">
      <span class="text-sm text-muted">
        Flight trainings: {{ flightTrainingsUsed }}/{{ MAX_FLIGHT_TRAININGS }}
      </span>
      <IconButton
        v-if="flightTrainingsUsed > 0"
        icon="i-lucide-rotate-ccw"
        color="neutral"
        @click="resetAllFlightTrainings"
      />
    </div>
    <div :class="counterClass">
      <span class="text-sm text-muted">
        Bonus points: {{ bonusLevelsUsed }}/{{ MAX_BONUS_POINTS }}
      </span>
      <IconButton
        v-if="bonusLevelsUsed > 0"
        icon="i-lucide-rotate-ccw"
        color="neutral"
        @click="resetAllBonusLevels"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import IconButton from '@/components/_shared/IconButton.vue';

import {
  MAX_POWER_TRAININGS,
  MAX_FLIGHT_TRAININGS,
  MAX_BONUS_POINTS
} from '@/types/hero';

// ---

const props = withDefaults(
  defineProps<{
    orientation?: 'horizontal' | 'vertical';
  }>(),
  { orientation: 'horizontal' }
);

// ---

const {
  ep3Cut,
  ep4Hire,
  showEp8Recruits,
  ep3CutItems,
  ep4HireItems,
  trainingsUsed,
  flightTrainingsUsed,
  resetAllPowerTrainings,
  resetAllFlightTrainings,
  bonusLevelsUsed,
  resetAllBonusLevels
} = useHeroPlanner();

// ---

const containerClass = computed(() => {
  return props.orientation === 'vertical'
    ? 'flex flex-col gap-4'
    : 'flex gap-6 items-center';
});

const counterClass = computed(() => {
  return props.orientation === 'vertical'
    ? 'flex items-center justify-between gap-2 min-h-6'
    : 'flex items-center gap-2';
});

const ep8SwitchClass = computed(() => {
  return props.orientation === 'vertical' ? 'min-h-6' : '';
});
</script>
