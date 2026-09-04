<template>
  <div
    data-loading-ring
    role="progressbar"
    aria-label="Loading"
    class="pointer-events-none fixed inset-x-0 top-(--ui-header-height) bottom-0 z-(--z-overlay) flex items-center justify-center"
  >
    <!-- * Feature 023. Fixed and anchored to the header's bottom edge rather than nested inside `u-main`: main is the app's one scrolling region (config/nuxt-ui/main.ts), so an absolutely positioned child of it would scroll away, and while booting main is hidden anyway. Reading the header height here is not the page-height arithmetic page-layout.md forbids — this layer sits outside the layout's height chain rather than restating it.
         ! Transparent, and nothing paints a ground: what shows through is the app's own background wash, one layer below. A colour here could drift from the loaded page's; the loaded page's cannot drift from itself.
         ! Comments belong inside the root, not above it: a comment at template top level makes the component multi-root, and `<Transition>` in app.vue takes a single child.
         * The ring is the annex's (§11): 32px, a 4px stroke, the primary over the same colour at 25%. `loading-ring` carries only the rotation and its reduced-motion guard; under `reduce` the ring stays drawn and stops turning. -->
    <div
      class="size-8 loading-ring rounded-full border-4 border-primary/25 border-t-primary"
    />
  </div>
</template>
