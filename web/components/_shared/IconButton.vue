<template>
  <u-button
    :icon="icon"
    :color="color"
    :size="size"
    :disabled="disabled"
    :active="active"
    :aria-label="label"
    :aria-pressed="active === undefined ? undefined : active"
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
    label?: string;
    color?: 'primary' | 'secondary' | 'neutral';
    size?: 'xs' | 'sm';
    disabled?: boolean;
    active?: boolean;
  }>(),
  { size: 'xs' }
);

defineEmits<{
  click: [];
}>();
</script>
