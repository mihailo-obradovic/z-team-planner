<template>
  <u-slideover
    v-model:open="open"
    side="right"
    title="Story setup"
    :ui="{ body: 'flex flex-col gap-8 p-4 sm:p-6' }"
  >
    <template #body>
      <div class="flex flex-col gap-4">
        <u-form-field label="Episode 3: Cut" size="xl">
          <u-select
            v-model="ep3Cut"
            :items="ep3CutItems"
            variant="subtle"
            class="w-full"
          />
        </u-form-field>

        <u-form-field label="Episode 4: Hire" size="xl">
          <u-select
            v-model="ep4Hire"
            :items="ep4HireItems"
            variant="subtle"
            class="w-full"
          />
        </u-form-field>

        <u-form-field
          label="Show Episode 8 recruits"
          orientation="horizontal"
          size="xl"
          class="justify-between"
        >
          <u-switch v-model="showEp8Recruits" size="xl" />
        </u-form-field>
      </div>

      <div class="flex flex-col gap-1">
        <u-separator
          label="Training budget"
          :ui="{
            label:
              'font-heading text-base font-bold tracking-tag text-dimmed uppercase'
          }"
        />

        <div
          v-for="budget in budgets"
          :key="budget.label"
          class="flex min-h-(--control-h-lg) items-center justify-between gap-2 border-b border-default last:border-b-0"
        >
          <span
            class="font-heading text-base font-bold tracking-label uppercase"
          >
            {{ budget.label }}
          </span>

          <span class="flex items-center gap-2">
            <span class="font-heading text-lg font-extrabold text-primary">
              {{ budget.used }}/{{ budget.max }}
            </span>

            <TooltipButton
              v-if="budget.used > 0"
              :text="`Reset ${budget.label.toLowerCase()}`"
              icon="i-lucide-rotate-ccw"
              color="neutral"
              size="sm"
              @click="budget.reset()"
            />
          </span>
        </div>
      </div>
    </template>

    <template #footer>
      <u-button
        block
        color="neutral"
        variant="subtle"
        icon="i-lucide-rotate-ccw"
        :disabled="!hasAnythingToReset"
        @click="resetAllTrainings"
      >
        Reset all trainings
      </u-button>
    </template>
  </u-slideover>
</template>

<script setup lang="ts">
import TooltipButton from '@/components/_shared/TooltipButton.vue';

import {
  MAX_POWER_TRAININGS,
  MAX_FLIGHT_TRAININGS,
  MAX_BONUS_POINTS
} from '@/types/hero';

const open = defineModel<boolean>('open', { required: true });

const {
  ep3Cut,
  ep4Hire,
  showEp8Recruits,
  ep3CutItems,
  ep4HireItems,
  trainingsUsed,
  flightTrainingsUsed,
  bonusLevelsUsed,
  resetAllPowerTrainings,
  resetAllFlightTrainings,
  resetAllBonusLevels,
  resetAllTrainings
} = useHeroPlanner();

const budgets = computed(() => [
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

const hasAnythingToReset = computed(() =>
  budgets.value.some((budget) => budget.used > 0)
);
</script>
