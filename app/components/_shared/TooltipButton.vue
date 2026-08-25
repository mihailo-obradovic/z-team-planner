<template>
  <u-tooltip :text="text">
    <IconButton
      :label="text"
      :icon="icon"
      :color="color"
      :size="size"
      :disabled="disabled"
      :active="active"
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
    active?: boolean;
  }>(),
  { size: 'xs' }
);

defineEmits<{
  click: [];
}>();
</script>
