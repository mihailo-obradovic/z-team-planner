<template>
  <div
    data-loading-ring
    role="progressbar"
    aria-label="Loading"
    class="pointer-events-none fixed inset-x-0 top-(--ui-header-height) bottom-0 z-(--z-overlay) flex items-center justify-center"
  >
    <!-- ! Comments stay inside the root: a top-level one makes the component multi-root, and app.vue's `<Transition>` takes a single child. -->
    <!-- * Fixed to the header's bottom edge, outside `u-main`, whose scroll would carry it away. -->
    <!-- ! Transparent, so the app's own background wash shows through unchanged. -->
    <!-- * `loading-ring` only rotates, so reduced motion stops the spin and keeps the ring. -->
    <div
      class="size-8 loading-ring rounded-full border-4 border-primary/25 border-t-primary"
    />
  </div>
</template>
