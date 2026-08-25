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
    // * Forwarded to IconButton — the power chips are toggles and say so.
    active?: boolean;
  }>(),
  // * The 24px stepper step, matching IconButton: the power chips under a hero's
  // * portrait are six of this component's seven call sites, and they have to fit
  // * four across the portrait's 108px (annex §4, §13). The Story Setup drawer's
  // * budget-reset glyph is the one 28px caller and passes `sm` itself.
  { size: 'xs' }
);

defineEmits<{
  click: [];
}>();
</script>
