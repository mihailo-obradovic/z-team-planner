<template>
  <div :class="containerClass">
    <u-form-field label="Episode 3: Cut" orientation="horizontal" :ui="fieldUi">
      <u-select v-model="ep3Cut" :items="ep3CutItems" variant="subtle" />
    </u-form-field>

    <u-form-field
      label="Episode 4: Hire"
      orientation="horizontal"
      :ui="fieldUi"
    >
      <u-select v-model="ep4Hire" :items="ep4HireItems" variant="subtle" />
    </u-form-field>

    <u-form-field
      label="Episode 8 recruits"
      orientation="horizontal"
      :class="ep8SwitchClass"
      :ui="fieldUi"
    >
      <u-switch v-model="showEp8Recruits" size="sm" />
    </u-form-field>

    <div v-for="counter in counters" :key="counter.label" :class="counterClass">
      <span :class="counterLabelClass">
        {{ counter.label }}:
        <span :class="counterValueClass"
          >{{ counter.used }}/{{ counter.max }}</span
        >
      </span>
      <IconButton
        v-if="counter.used > 0"
        icon="i-lucide-rotate-ccw"
        color="neutral"
        @click="counter.reset()"
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

const counters = computed(() => [
  {
    label: 'Power trainings',
    used: trainingsUsed.value,
    max: MAX_POWER_TRAININGS,
    reset: resetAllPowerTrainings
  },
  {
    label: 'Flight trainings',
    used: flightTrainingsUsed.value,
    max: MAX_FLIGHT_TRAININGS,
    reset: resetAllFlightTrainings
  },
  {
    label: 'Bonus points',
    used: bonusLevelsUsed.value,
    max: MAX_BONUS_POINTS,
    reset: resetAllBonusLevels
  }
]);

// * A per-instance :ui override rather than a config change, because the same component renders on both grounds — the config's toned ink is right on paper and unreadable on the teal chrome.
const fieldUi = computed(() => {
  return props.orientation === 'vertical'
    ? {}
    : { label: 'text-secondary-300' };
});

// * The two orientations sit on different grounds, so the colours cannot be shared: horizontal renders on the teal chrome, vertical on the slideover's paper. Steel and gold read on chrome; ink-soft and ink read on paper. The previous single text-muted was ink-soft on teal either way, which is barely legible.
const counterLabelClass = computed(() => {
  return props.orientation === 'vertical'
    ? 'font-heading tracking-label text-sm uppercase text-toned'
    : 'font-heading tracking-label text-sm uppercase text-secondary-300';
});

const counterValueClass = computed(() => {
  return props.orientation === 'vertical'
    ? 'font-bold text-highlighted'
    : 'font-bold text-warning';
});
</script>
