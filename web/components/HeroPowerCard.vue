<template>
  <!-- * No `click` emit: an undeclared `@click` falls through to the root, and the parent decides what a disabled click does. -->
  <div
    class="border-2 p-3 transition-colors"
    :class="[
      active
        ? 'border-accented bg-elevated'
        : 'border-default hover:border-accented/50',
      disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
    ]"
  >
    <!-- ! `min-w-0` lets the name shrink, so `flex-wrap` can drop the badge to its own line. -->
    <div class="flex flex-wrap items-center gap-2">
      <u-icon :name="icon" class="size-4 shrink-0" />

      <span class="min-w-0 font-medium">{{ name }}</span>

      <u-badge
        v-if="active && badge"
        :label="badge"
        size="xs"
        variant="subtle"
        class="shrink-0"
      />
    </div>

    <!-- ! Every variant renders invisibly in one grid cell, reserving the tallest, so toggling never collapses the card. -->
    <div v-if="descriptionVariants" class="mt-1 grid">
      <p
        v-for="variant in descriptionVariants"
        :key="variant"
        class="invisible col-start-1 row-start-1 text-sm text-muted"
        aria-hidden="true"
      >
        {{ variant }}
      </p>

      <p class="col-start-1 row-start-1 text-sm text-muted">
        {{ description }}
      </p>
    </div>

    <p v-else class="mt-1 text-sm text-muted">
      {{ description }}
    </p>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    icon: string;
    name: string;
    description: string;
    active: boolean;
    disabled?: boolean;
    // * Shown only while active.
    badge?: string;
    // * Every line the description can be, when its height must not change with state.
    descriptionVariants?: string[];
  }>(),
  { disabled: false }
);
</script>
