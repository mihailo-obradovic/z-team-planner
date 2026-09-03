<template>
  <!-- * The `click` listener falls through to `IconButton` and on to the button itself; see the note there. -->
  <u-tooltip :text="text">
    <IconButton
      :label="text"
      :icon="icon"
      :color="color"
      :size="size"
      :disabled="disabled"
      :active="active"
    />
  </u-tooltip>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    text: string;
    icon: string;
    color?: 'primary' | 'secondary' | 'neutral';
    size?: 'xs' | 'sm';
    disabled?: boolean;
    active?: boolean;
  }>(),
  { size: 'xs' }
);
</script>
