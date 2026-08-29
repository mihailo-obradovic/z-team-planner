<template>
  <!-- * `#__nuxt` is the pinned flex column (main.css) and this page is its only child, so height comes from the chain rather than a viewport unit (annex §4). Its own scroll region, because that column is `overflow: hidden`. -->
  <div
    class="flex min-h-0 flex-1 flex-col items-center justify-center overflow-y-auto p-4 md:p-6"
  >
    <div
      class="flex w-full max-w-[65ch] flex-col items-center gap-4 bg-default p-6 text-center panel"
    >
      <span
        v-if="statusCode"
        class="font-heading text-display text-primary"
        aria-hidden="true"
      >
        {{ statusCode }}
      </span>

      <h1 class="font-heading text-title text-highlighted uppercase">
        {{ heading }}
      </h1>

      <p class="text-sm text-muted">{{ supportingLine }}</p>

      <u-button
        size="lg"
        color="primary"
        icon="i-lucide-arrow-left"
        label="Back to the planner"
        @click="handleBackToPlanner"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { NuxtError } from '#app';

const props = defineProps<{ error: NuxtError }>();

// ! Never names the build or says it existed: deleted, never-existed and someone else's are one answer (feature 007).
const NOT_FOUND_LINE =
  'The link may be wrong, or what it pointed to may no longer be there.';
const GENERIC_LINE =
  'Please try again. Anything saved on this device is untouched.';

const isNotFound = computed(() => props.error?.statusCode === 404);

// * Falsy rather than nullish: an error with no status must render no code at all, never "undefined".
const statusCode = computed(() => props.error?.statusCode || null);

// ! Read from `data`, never `statusMessage`: Nuxt sets that itself for an unmatched route, as `Page not found: <path>` — which would reflect an arbitrary requested path into the page's own heading. A heading is opted into by the caller that raised the error, or it is this page's own.
const heading = computed(
  () =>
    (props.error?.data as { heading?: string } | undefined)?.heading ||
    (isNotFound.value ? 'Page not found' : 'Something went wrong')
);

// * Always the page's own line, so it can never come out as a second copy of the heading.
const supportingLine = computed(() =>
  isNotFound.value ? NOT_FOUND_LINE : GENERIC_LINE
);

function handleBackToPlanner() {
  clearError({ redirect: '/' });
}
</script>
