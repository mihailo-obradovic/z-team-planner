<template>
  <!-- * No `click` emit: declaring one would fire twice, while an undeclared `@click` reaches the native button through `attrs`. -->
  <!-- ! `attrs` are bound by hand and first, so the description wins over the `aria-describedby` a tooltip trigger falls through: Reka sets it only while the tooltip is open, and its `undefined` would erase ours the rest of the time. -->
  <!-- * `readonly` keeps the glyph and its colour but renders a span with `role="img"`: information, not a control (composition rules, Read-only regions). -->
  <u-button
    v-bind="attrs"
    :as="readonly ? 'span' : undefined"
    :role="readonly ? 'img' : undefined"
    :icon="swapKey === undefined ? icon : undefined"
    :color="color"
    :size="size"
    :disabled="readonly ? undefined : disabled"
    :active="active"
    :aria-label="label"
    :aria-describedby="description ? descriptionId : attrs['aria-describedby']"
    :aria-pressed="
      readonly || indicator || active === undefined ? undefined : active
    "
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

    <span v-if="description" :id="descriptionId" class="sr-only">{{
      description
    }}</span>
  </u-button>
</template>

<script setup lang="ts">
defineOptions({ inheritAttrs: false });

withDefaults(
  defineProps<{
    icon?: string;
    label?: string;
    color?: 'primary' | 'secondary' | 'neutral';
    size?: 'xs' | 'sm';
    disabled?: boolean;
    active?: boolean;
    // * The on look without the toggle semantics: a stepper that shows a state it advances rather than flips carries no `aria-pressed`.
    indicator?: boolean;
    // * Changing it swaps the glyph out-in; absent, the glyph is static.
    swapKey?: string | number;
    readonly?: boolean;
    // * Read after the name; always in the DOM, unlike a tooltip, which a touch screen reader never opens (feature 018).
    description?: string;
  }>(),
  { size: 'xs' }
);

const attrs = useAttrs();
const descriptionId = useId();
</script>
