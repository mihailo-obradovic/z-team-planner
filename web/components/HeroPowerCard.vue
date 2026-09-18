<template>
  <!-- * No `click` emit: an undeclared `@click` falls through to the button, and a disabled one fires none. -->
  <button
    type="button"
    class="block w-full border-2 p-3 text-left transition-colors"
    :class="[
      active
        ? 'border-accented bg-elevated'
        : 'border-default hover:border-accented/50',
      disabled ? 'cursor-not-allowed opacity-40' : 'cursor-pointer'
    ]"
    :disabled="disabled"
    :aria-pressed="active"
  >
    <!-- ! `min-w-0` lets the name shrink, so `flex-wrap` can drop the badge to its own line. -->
    <!-- ! The badge is always laid out and only hidden while inactive: mounting it wrapped the row and grew the card 24px at 320 and 1024. -->
    <span class="flex flex-wrap items-center gap-2">
      <u-icon :name="icon" class="size-4 shrink-0" />

      <span class="min-w-0 font-medium">{{ name }}</span>

      <u-badge
        v-if="badge"
        :label="badge"
        size="xs"
        variant="subtle"
        class="shrink-0"
        :class="active ? undefined : 'invisible'"
      />
    </span>

    <!-- ! Every variant renders invisibly in one grid cell, reserving the tallest, so toggling never collapses the card. -->
    <span v-if="descriptionVariants" class="mt-1 grid">
      <span
        v-for="variant in descriptionVariants"
        :key="variant"
        class="invisible col-start-1 row-start-1 text-sm text-muted"
        aria-hidden="true"
      >
        {{ variant }}
      </span>

      <span class="col-start-1 row-start-1 text-sm text-muted">
        {{ description }}
      </span>
    </span>

    <span v-else class="mt-1 block text-sm text-muted">
      {{ description }}
    </span>
  </button>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    icon: string;
    name: string;
    description: string;
    active: boolean;
    disabled?: boolean;
    // * Visible only while active; its space is always reserved.
    badge?: string;
    // * Every line the description can be, when its height must not change with state.
    descriptionVariants?: string[];
  }>(),
  { disabled: false }
);
</script>
