<template>
  <!-- * No `click` emit is declared, deliberately. An emit named after an input device is
       * what the style guide rules out, and re-emitting one would also fire twice: with no
       * declaration a parent's `@click` stays in attrs and falls through to the button
       * itself, which is the native event the call sites already expect. -->
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
</script>
