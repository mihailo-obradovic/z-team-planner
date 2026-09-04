<template>
  <div
    data-loading-cover
    class="fixed inset-x-0 top-(--ui-header-height) bottom-0 z-(--z-overlay) flex items-center justify-center bg-secondary-900"
    role="progressbar"
    aria-label="Loading"
  >
    <!-- * Feature 023. The root is fixed and anchored to the header's bottom edge rather than nested inside `u-main`: main is the app's one scrolling region (config/nuxt-ui/main.ts), so an absolutely positioned child of it would scroll away with the content it is covering. Reading the header height here is not the page-height arithmetic page-layout.md forbids — this is the shell's own overlay, outside the layout's height chain rather than restating it.
         ! Opaque on purpose: a translucent cover would show the very rearrangement it exists to hide. The ground is the body's own (main.css), so it reads as the page not having arrived rather than as a panel on top of it.
         ! Comments belong inside the root, not above it: a comment at template top level makes the component multi-root, and `<Transition>` in app.vue takes a single child.
         * The ring is the annex's (§11): 32px, a 4px stroke, the primary over the same colour at 25%. `loading-ring` carries only the rotation and its reduced-motion guard; under `reduce` the ring stays drawn and stops turning. -->
    <div
      class="size-8 loading-ring rounded-full border-4 border-primary/25 border-t-primary"
    />
  </div>
</template>
