<template>
  <div class="hidden items-center gap-6 md:flex">
    <span
      v-for="counter in counters"
      :key="counter.label"
      class="flex items-center gap-1"
    >
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

const { trainingsUsed, flightTrainingsUsed, bonusLevelsUsed } =
  useHeroPlanner();

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
