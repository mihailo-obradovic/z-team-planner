<template>
  <!-- * No `click` emit: declaring one would fire twice, while an undeclared `@click` falls through to the native button. -->
  <u-button
    :icon="swapKey === undefined ? icon : undefined"
    :color="color"
    :size="size"
    :disabled="disabled"
    :active="active"
    :aria-label="label"
    :aria-pressed="active === undefined ? undefined : active"
    variant="subtle"
    square
  >
    <!-- * The leading slot replaces the button's own icon, so `size-4` restates the theme's leadingIcon size. -->
    <template v-if="swapKey !== undefined" #leading>
      <Transition name="glyph-swap" mode="out-in">
        <span :key="swapKey" class="flex items-center justify-center">
          <u-icon v-if="icon" :name="icon" class="size-4 shrink-0" />

          <slot v-else />
        </span>
      </Transition>
    </template>

    <slot v-if="swapKey === undefined" />
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
    // * Changing it swaps the glyph out-in; absent, the glyph is static.
    swapKey?: string | number;
  }>(),
  { size: 'xs' }
);
</script>
