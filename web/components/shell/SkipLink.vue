<template>
  <!-- * Rendered first in the shell, so a keyboard reaches it before the header's controls. -->
  <!-- ! Fixed while shown rather than in flow: a link that takes its space back on focus pushes the header down. -->
  <a
    :href="`#${MAIN_CONTENT_ID}`"
    class="sr-only focus-visible:not-sr-only focus-visible:fixed focus-visible:top-4 focus-visible:left-4 focus-visible:z-(--z-toast) focus-visible:bg-default focus-visible:px-3 focus-visible:py-2 focus-visible:font-heading focus-visible:text-label focus-visible:text-highlighted focus-visible:uppercase focus-visible:panel"
    @click="handleSkip"
  >
    Skip to main content
  </a>
</template>

<script setup lang="ts">
import { MAIN_CONTENT_ID } from '@/types/header';

// ! Focus moves by script rather than by the fragment: the router would otherwise put the id into the planner's URL.
function handleSkip(event: MouseEvent) {
  event.preventDefault();
  document.getElementById(MAIN_CONTENT_ID)?.focus();
}
</script>
