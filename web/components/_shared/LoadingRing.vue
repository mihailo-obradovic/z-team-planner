<template>
  <div
    data-loading-ring
    role="progressbar"
    aria-label="Loading"
    class="pointer-events-none fixed inset-x-0 top-(--ui-header-height) bottom-0 z-(--z-overlay) flex items-center justify-center"
  >
    <!-- ! Comments belong inside the root: one at template top level makes the component multi-root, and the `<Transition>` in app.vue takes a single child. -->
    <!-- * Fixed to the header's bottom edge rather than inside `u-main`, the app's one scrolling region, where it would scroll away (feature 023); this layer sits outside the layout's height chain rather than restating it. -->
    <!-- ! Transparent on purpose: the app's own background wash shows through, and a colour here could drift from the loaded page's. -->
    <!-- * The annex's ring (§11); `loading-ring` carries only the rotation, which stops under reduced motion while the ring stays drawn. -->
    <div
      class="size-8 loading-ring rounded-full border-4 border-primary/25 border-t-primary"
    />
  </div>
</template>
