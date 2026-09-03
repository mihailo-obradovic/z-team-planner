<template>
  <div class="flex items-center gap-1 @max-[28.5rem]:gap-0.5">
    <IconButton
      icon="i-lucide-minus"
      :label="`Decrease ${label}`"
      :disabled="value === null || (!unsettable && value <= 0)"
      @click="step(-1)"
    />

    <!-- * A fixed slot, like the stat rows everywhere else: the value growing a digit (or
         becoming the unset dash) shifts nothing. It narrows in the tier where the row is
         tight (feature 016) — the buttons beside it cannot, being on the 24px touch floor
         (annex §14.2), so the slot and the gaps are what give. -->
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
// * The mission templates' value control (feature 015): REQs step 0–10; a threshold column
// * is unsettable — stepping below 1 clears it to the dash, stepping up from the dash
// * starts at 1. The guarded planner setters have the same ranges; this control simply
// * never offers a value they would refuse.
import { MAX_STAT_VALUE } from '@/types/hero';

const props = withDefaults(
  defineProps<{
    value: number | null;
    label: string;
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
