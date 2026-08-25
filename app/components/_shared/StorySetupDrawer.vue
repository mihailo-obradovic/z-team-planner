<template>
  <u-slideover
    v-model:open="open"
    side="right"
    title="Story setup"
    :ui="{ body: 'flex flex-col gap-8 p-4 sm:p-6' }"
  >
    <template #body>
      <div class="flex flex-col gap-4">
        <u-form-field label="Episode 3: Cut">
          <u-select v-model="ep3Cut" :items="ep3CutItems" variant="subtle" />
        </u-form-field>

        <u-form-field label="Episode 4: Hire">
          <u-select v-model="ep4Hire" :items="ep4HireItems" variant="subtle" />
        </u-form-field>

        <u-form-field label="Show Episode 8 recruits">
          <u-switch v-model="showEp8Recruits" size="sm" />
        </u-form-field>

        <p class="border-l-2 border-accented pl-3 text-sm text-muted">
          Mirror your story: who was cut in Episode 3, who you hired in Episode
          4. Synergy pairs update to match.
        </p>
      </div>

      <div class="flex flex-col gap-1">
        <h3 class="font-heading text-label text-dimmed uppercase">
          Training budget
        </h3>

        <div
          v-for="budget in budgets"
          :key="budget.label"
          class="flex min-h-(--control-h-lg) items-center justify-between gap-2 border-b border-default last:border-b-0"
        >
          <span class="font-heading text-label uppercase">
            {{ budget.label }}
          </span>

          <span class="flex items-center gap-2">
            <span class="font-heading text-label text-primary">
              {{ budget.used }}/{{ budget.max }}
            </span>

            <!-- * A reset is offered only while the budget is non-zero (feature 003, Business Rules) — an always-present reset on an empty budget is a no-op control. -->
            <TooltipButton
              v-if="budget.used > 0"
              :text="`Reset ${budget.label.toLowerCase()}`"
              icon="i-lucide-rotate-ccw"
              color="neutral"
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

// ---

// * Ephemeral by contract (feature 003, Story Setup drawer): the open state is owned by the shell, not persisted and not addressable by URL. Every control below writes through immediately, so there is no commit step and closing discards nothing.
const open = defineModel<boolean>('open', { required: true });

// ---

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

// ---

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
