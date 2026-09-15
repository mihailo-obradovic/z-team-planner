<template>
  <!-- * No `click` emit is declared: re-emitting one would fire twice, while an undeclared `@click` falls through to the native button the call sites expect. -->
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
    <!-- * Annex §11 glyph swap (feature 024): with a swap key the glyph — the icon, or the slot when there is none — is keyed by it and swaps out-in. The leading slot replaces the button's own icon, so the icon class is restated: `size-4` is the theme's leadingIcon at both `xs` and `sm`. -->
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
    // * A value that changes exactly when the glyph does; its change is what runs the swap (feature 024). Absent, the glyph is static.
    swapKey?: string | number;
  }>(),
  { size: 'xs' }
);
</script>
