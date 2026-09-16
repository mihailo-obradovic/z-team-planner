<template>
  <div class="flex items-center gap-1 @max-[28.5rem]:gap-0.5">
    <IconButton
      icon="i-lucide-minus"
      :label="`Decrease ${label}`"
      :disabled="value === null || (!unsettable && value <= 0)"
      @click="handleDecrease"
    />

    <!-- * Fixed width, so a new digit or the dash shifts nothing; the tight tier narrows it because the buttons sit on the 24px touch floor. -->
    <span
      class="w-7 text-center font-heading text-lg font-bold select-none @max-[28.5rem]:w-6"
    >
      {{ value ?? '—' }}
    </span>

    <IconButton
      icon="i-lucide-plus"
      :label="`Increase ${label}`"
      :disabled="value === MAX_STAT_VALUE"
      @click="handleIncrease"
    />
  </div>
</template>

<script setup lang="ts">
import { MAX_STAT_VALUE } from '@/types/hero';

const props = withDefaults(
  defineProps<{
    value: number | null;
    label: string;
    // * Stepping below 1 clears to the dash; stepping up from the dash starts at 1.
    unsettable?: boolean;
  }>(),
  { unsettable: false }
);

const emit = defineEmits<{
  change: [value: number | null];
}>();

function handleDecrease() {
  step(-1);
}

function handleIncrease() {
  step(1);
}

function step(direction: -1 | 1) {
  if (props.value === null) {
    if (direction === 1) {
      emit('change', 1);
    }

    return;
  }

  const next = props.value + direction;

  if (props.unsettable && next < 1) {
    emit('change', null);
  } else if (next >= 0 && next <= MAX_STAT_VALUE) {
    emit('change', next);
  }
}
</script>
