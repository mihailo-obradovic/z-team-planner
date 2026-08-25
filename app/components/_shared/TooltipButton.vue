<template>
  <u-tooltip :text="text">
    <IconButton
      :label="text"
      :icon="icon"
      :color="color"
      :size="size"
      :disabled="disabled"
      @click="$emit('click')"
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
  }>(),
  // * Power and flight chips are the 28px step, a size up from a bare stepper (design-system annex §4)
  { size: 'sm' }
);

defineEmits<{
  click: [];
}>();
</script>
