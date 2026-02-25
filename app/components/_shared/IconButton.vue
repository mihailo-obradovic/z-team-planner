<template>
  <UButton
    :icon="icon"
    :color="color"
    :size="size"
    :disabled="disabled"
    variant="soft"
    class="p-1"
    @click="$emit('click')"
  >
    <slot />
  </UButton>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    icon?: string;
    color?: 'primary' | 'secondary' | 'neutral';
    size?: 'xs' | 'sm';
    disabled?: boolean;
  }>(),
  { size: 'xs' }
);

defineEmits<{
  click: [];
}>();
</script>
