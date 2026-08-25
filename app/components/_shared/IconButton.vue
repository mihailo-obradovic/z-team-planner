<template>
  <u-button
    :icon="icon"
    :color="color"
    :size="size"
    :disabled="disabled"
    :aria-label="label"
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
    // * An icon-only button has no text to name it. Nothing else in the markup will:
    // * a tooltip contributes aria-describedby, not the accessible name, so a button
    // * left without this reaches the a11y tree unnamed (WCAG 4.1.2).
    label?: string;
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
