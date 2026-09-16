<template>
  <!-- ! Cream, not text-inverted, which resolves to ink on the teal chrome. -->
  <button
    v-if="tier === 'bare'"
    type="button"
    class="size-11 touch-manipulation items-center justify-center text-neutral-100"
    :class="visibilityClass"
    aria-label="Story setup"
    @click="handleOpen"
  >
    <u-icon name="i-lucide-sliders-horizontal" class="size-5" />
  </button>

  <u-tooltip v-else text="Story setup" :disabled="tier === 'labelled'">
    <u-button
      size="md"
      variant="subtle"
      color="neutral"
      icon="i-lucide-sliders-horizontal"
      :class="visibilityClass"
      :label="tier === 'labelled' ? 'Story setup' : undefined"
      :aria-label="tier === 'labelled' ? undefined : 'Story setup'"
      @click="handleOpen"
    />
  </u-tooltip>
</template>

<script setup lang="ts">
import { HEADER_TIER_CLASS } from '@/types/header';

import type { HeaderTier } from '@/types/header';

const props = withDefaults(defineProps<{ tier?: HeaderTier }>(), {
  tier: 'labelled'
});

const emit = defineEmits<{ open: [] }>();

const visibilityClass = computed(() => HEADER_TIER_CLASS[props.tier]);

function handleOpen() {
  emit('open');
}
</script>
