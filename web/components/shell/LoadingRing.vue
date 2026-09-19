<template>
  <div
    data-loading-ring
    role="progressbar"
    aria-label="Loading"
    class="pointer-events-none fixed inset-x-0 top-(--ui-header-height) bottom-0 z-(--z-overlay) flex items-center justify-center"
  >
    <!-- ! Comments stay inside the root: a top-level one makes this multi-root, and app.vue's `<Transition>` takes one child. -->
    <!-- * Pinned outside `u-main`, whose scroll would carry the ring away. -->
    <div
      class="size-8 loading-ring rounded-full border-4 border-primary/25 border-t-primary"
    />
  </div>
</template>
