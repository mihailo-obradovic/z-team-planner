<template>
  <div class="hidden items-center gap-6 md:flex">
    <span
      v-for="counter in counters"
      :key="counter.label"
      class="flex items-center gap-1"
    >
      <!-- * Steel on chrome is 5.09:1 and gold on chrome 6.76:1 (annex §14.1). These are chrome-only colours: this component never renders on paper, which is why they are written here rather than derived from a ground prop. -->
      <span class="font-heading text-label text-secondary-300 uppercase">
        {{ counter.label }}
      </span>
      <span class="font-heading text-label text-warning">
        {{ counter.used }}/{{ counter.max }}
      </span>
    </span>
  </div>
</template>

<script setup lang="ts">
import {
  MAX_POWER_TRAININGS,
  MAX_FLIGHT_TRAININGS,
  MAX_BONUS_POINTS
} from '@/types/hero';

// ---

const { trainingsUsed, flightTrainingsUsed, bonusLevelsUsed } =
  useHeroPlanner();

// ---

// * Readout only — no resets. Those are the drawer's Training budget rows (feature 003, Budget readout).
const counters = computed(() => [
  {
    label: 'Powers',
    used: trainingsUsed.value,
    max: MAX_POWER_TRAININGS
  },
  {
    label: 'Flight',
    used: flightTrainingsUsed.value,
    max: MAX_FLIGHT_TRAININGS
  },
  {
    label: 'Bonus',
    used: bonusLevelsUsed.value,
    max: MAX_BONUS_POINTS
  }
]);
</script>
