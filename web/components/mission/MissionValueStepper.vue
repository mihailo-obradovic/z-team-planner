<template>
  <div class="flex items-center gap-1 @max-[28.5rem]:gap-0.5">
    <IconButton
      icon="i-lucide-minus"
      :label="`Decrease ${label}`"
      :disabled="value === null || (!unsettable && value <= 0)"
      @click="step(-1)"
    />

    <!-- * A fixed slot, so a value growing a digit or becoming the dash shifts nothing; in the tight tier it and the gaps narrow, because the buttons sit on the 24px touch floor (feature 016, annex §14.2). -->
    <span
      class="w-7 text-center font-heading text-lg font-bold select-none @max-[28.5rem]:w-6"
    >
      {{ value ?? '—' }}
    </span>

    <IconButton
      icon="i-lucide-plus"
      :label="`Increase ${label}`"
      :disabled="value === MAX_STAT_VALUE"
      @click="step(1)"
    />
  </div>
</template>

<script setup lang="ts">
import { MAX_STAT_VALUE } from '@/types/hero';

const props = withDefaults(
  defineProps<{
    value: number | null;
    label: string;
    // * Stepping below 1 clears the value to the dash, and stepping up from the dash starts at 1 (feature 015).
    unsettable?: boolean;
  }>(),
  { unsettable: false }
);

const emit = defineEmits<{
  change: [value: number | null];
}>();

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
