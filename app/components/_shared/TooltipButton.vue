<template>
  <UTooltip :text="text">
    <IconButton
      :icon="icon"
      :color="color"
      :size="size"
      :disabled="disabled"
      @click="$emit('click')"
    />
  </UTooltip>
</template>

<script setup lang="ts">
defineProps<{
  text: string;
  icon: string;
  color?: 'primary' | 'secondary' | 'neutral';
  size?: 'xs' | 'sm';
  disabled?: boolean;
}>();

defineEmits<{
  click: [];
}>();
</script>
