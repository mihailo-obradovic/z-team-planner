<template>
  <u-button
    :icon="icon"
    :color="color"
    :size="size"
    :disabled="disabled"
    variant="subtle"
    square
    @click="$emit('click')"
  >
    <slot />
  </u-button>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    icon?: string;
    color?: 'primary' | 'secondary' | 'neutral';
    // * xs is the 24px stepper step; sm is the 28px chip step (design-system annex §4)
    size?: 'xs' | 'sm';
    disabled?: boolean;
  }>(),
  { size: 'xs' }
);

defineEmits<{
  click: [];
}>();
</script>
