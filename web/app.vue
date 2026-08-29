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
          class="flex size-11 items-center justify-center text-neutral-100 md:hidden"
          aria-label="Story setup"
          @click="openStorySetup"
        >
          <u-icon name="i-lucide-sliders-horizontal" class="size-5" />
        </button>

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
      </template>
    </u-header>

    <NuxtImg
      src="/images/background.webp"
      class="pointer-events-none fixed inset-0 h-full w-full object-cover opacity-20"
      alt=""
    />

    <u-main class="relative z-10">
      <NuxtPage />
    </u-main>

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

function openStorySetup() {
  storySetupOpen.value = true;
}

onMounted(async () => {
  await loadInitialBuild();
  setupBeforeUnload();
});

useHead({
  meta: [{ name: 'viewport', content: 'width=device-width, initial-scale=1' }],
  link: [{ rel: 'icon', href: '/favicon.ico' }],
  htmlAttrs: {
    lang: 'en'
  }
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
