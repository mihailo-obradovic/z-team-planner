<template>
  <u-app>
    <u-header class="shrink-0">
      <template #title>
        <span class="font-heading text-title">
          Z-Team <span class="text-primary">Planner</span>
        </span>

        <span
          class="ml-2 hidden font-sans text-xs tracking-widest text-secondary-300 uppercase xl:inline"
        >
          Build calculator
        </span>
      </template>

      <template #right>
        <BudgetCounters />

        <div class="mx-2 hidden h-7 w-px bg-secondary-400 md:block" />

        <!-- ! Using localStorage in SSR causes hydration errors if not client-only -->
        <ClientOnly>
          <BuildManager class="hidden lg:flex" tier="labelled" />
          <BuildManager
            class="hidden md:flex lg:hidden"
            :labelled="false"
            tier="icon"
          />
        </ClientOnly>

        <!-- * Outside ClientOnly on purpose: the store starts `unknown` on the server and on
             * the first client render alike, so both draw the same reserved slot and the
             * prerendered page never shows the wrong button (feature 004). -->
        <AuthMenu tier="labelled" />

        <AuthMenu tier="icon" />

        <AuthMenu tier="bare" />

        <u-button
          class="hidden lg:inline-flex"
          size="md"
          variant="subtle"
          color="neutral"
          icon="i-lucide-sliders-horizontal"
          label="Story setup"
          @click="openStorySetup"
        />

        <u-tooltip text="Story setup">
          <u-button
            class="hidden md:inline-flex lg:hidden"
            size="md"
            variant="subtle"
            color="neutral"
            icon="i-lucide-sliders-horizontal"
            aria-label="Story setup"
            @click="openStorySetup"
          />
        </u-tooltip>

        <!-- ! Cream, not text-inverted: --ui-text-inverted resolves to ink, which is right on the amber and gold solids and unreadable on the teal chrome this glyph sits on (annex §1, §14.1 — cream on chrome is 9.03:1). -->
        <button
          type="button"
          class="flex size-11 touch-manipulation items-center justify-center text-neutral-100 md:hidden"
          aria-label="Story setup"
          @click="openStorySetup"
        >
          <u-icon name="i-lucide-sliders-horizontal" class="size-5" />
        </button>
      </template>
    </u-header>

    <!-- * `width` is the master's own 2560 and there is no 2x: `image.screens` is feature 021's portrait list, a width-less image would be snapped to its largest entry, and the module's default densities would ask for a 5120 that no source has. The wash's fitting size per viewport is a change of its own. -->
    <NuxtImg
      src="/images/background.webp"
      width="2560"
      densities="x1"
      class="pointer-events-none fixed inset-0 h-full w-full object-cover opacity-20"
      alt=""
    />

    <!-- * Feature 023. All three are true on the server, in the prerender and on the first
         * client render alike, and all three drop together once the build is loaded.
         * ! `covered || undefined`, not `covered`: Vue only removes an attribute when the value
         * ! is null or undefined, and `inert="false"` still makes an element inert. -->
    <u-main
      class="relative z-10"
      :class="{ 'overflow-hidden': covered }"
      :inert="covered || undefined"
      :aria-busy="covered || undefined"
    >
      <NuxtPage />
    </u-main>

    <!-- * Leave-only: the cover is already there when the app mounts, so it has no enter to play. -->
    <Transition
      leave-active-class="transition-opacity duration-(--duration-baseline) ease-in"
      leave-to-class="opacity-0"
    >
      <LoadingCover v-if="covered" />
    </Transition>

    <!-- ! Using localStorage in SSR causes hydration errors if not client-only -->
    <ClientOnly>
      <FirstRunBanners />
    </ClientOnly>

    <!-- ! Using localStorage in SSR causes hydration errors if not client-only -->
    <ClientOnly>
      <div
        class="shrink-0 border-t-2 border-secondary-950 bg-secondary-800 p-3 md:hidden"
      >
        <BuildManager block size="lg" tier="bare" />
      </div>
    </ClientOnly>

    <!-- ! Using localStorage in SSR causes hydration errors if not client-only -->
    <ClientOnly>
      <BuildDialogs />

      <BuildAccountDialogs />

      <BuildConflictDialog />

      <FirstLoginOffer />
    </ClientOnly>

    <AccountDialogs />

    <StorySetupDrawer v-model:open="storySetupOpen" />
  </u-app>
</template>

<script setup lang="ts">
const title = 'Z-Team Planner';
const description =
  'A build calculator for Dispatch. Plan your Z-Team ahead of time: level heroes, train powers and flight, pick synergy pairs, and mirror your story choices. Builds save in your browser and share as a link.';

const { loadInitialBuild } = useInitialBuild();
const { setupBeforeUnload } = useUnsavedChanges();

const storySetupOpen = ref(false);

// * Feature 023. Read once, not reactively: the cover belongs to the boot of `/`, never to a
// * later navigation that happens to land there. The value is the same on the server, in the
// * prerendered HTML and on the first client render, which is what keeps the cover out of the
// * hydration diff — it is removed only after mount, below.
// * A plain ref rather than the query layer's `isPending` (stacks/frontend/nuxt/nuxt.md): what
// * this waits on is local planner state read from localStorage, not a request, so there is no
// * query whose state could stand in for it.
const covered = ref(useRoute().path === '/');

function openStorySetup() {
  storySetupOpen.value = true;
}

onMounted(async () => {
  // * `finally`, so a build that will not deserialize reveals the planner instead of leaving the
  // * visitor behind a ring that never stops. What happens after the throw is unchanged: the
  // * leave-site prompt is still not armed, because there is no loaded build to lose.
  // ! The `catch` is what keeps that throw from becoming an unhandled rejection — it was one
  // ! before this cover existed too, silent and unattributable. Reported the way the Firebase
  // ! plugin reports its own failure, and nowhere else: this is a log, not a surface.
  try {
    await loadInitialBuild();
  } catch (error) {
    console.error('The initial build could not be loaded.', error);

    return;
  } finally {
    covered.value = false;
  }

  setupBeforeUnload();
});

useHead({
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1' },
    // * The chrome the header already paints, so the browser's own bar continues the page rather than framing it (annex §1, lagoon 600).
    { name: 'theme-color', content: '#143e38' }
  ],
  link: [
    // ! Order matters: a browser takes the first icon it understands, so the scalable one leads and the .ico is the fallback for those that ignore SVG.
    { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
    { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
    {
      rel: 'apple-touch-icon',
      sizes: '180x180',
      href: '/apple-touch-icon.png'
    },
    { rel: 'manifest', href: '/site.webmanifest' }
  ],
  htmlAttrs: {
    lang: 'en'
  },

  // * Feature 023. The cover is in `/`'s prerendered HTML and only JavaScript ever lifts it, so
  // * with scripting off it would sit there for good over a planner that is perfectly readable.
  // ! In <head>, not the template: with scripting *on*, a browser parses the contents of a
  // ! <noscript> element as plain text, while Vue's virtual DOM holds a <style> element — and
  // ! hydrating one against the other is the exact mismatch this feature exists to avoid.
  noscript: [{ innerHTML: '<style>[data-loading-cover]{display:none}</style>' }]
});

// ! No ogImage or twitterImage on purpose. Both pointed at a Nuxt UI template screenshot left over from the starter, and decision 003 removed them rather than ship a picture of someone else's product — twitterCard dropped to `summary` at the same time, so cards render as text instead of a broken image.
// TODO: Add a real share image, then restore ogImage/twitterImage here and set twitterCard back to `summary_large_image`.
useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description,
  twitterCard: 'summary'
});
</script>
