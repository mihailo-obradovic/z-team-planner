<template>
  <u-app>
    <u-header class="shrink-0">
      <template #title>
        <span class="font-heading text-title">
          Z-Team<span class="text-primary"> Planner</span>
        </span>
        <!-- * The subtitle is the first thing the tier ladder drops (annex §13): it is decoration, and the header needs the width back at lg. -->
        <span
          class="ml-2 hidden font-sans text-xs tracking-widest text-secondary-300 uppercase xl:inline"
        >
          Build calculator
        </span>
      </template>

      <template #right>
        <BudgetCounters />

        <!-- * The board draws this 1px × 28 in a teal lighter than the bar, which reads as a divider — secondary-700 was darker than the chrome and read as a seam. secondary-500 is lighter but only 1.29:1 and still barely visible, so this is the 400 step at 2.74:1: above the bar, below the steel of the labels it separates, so it divides without competing (annex §1, §14.1). mx-2 on top of the row's gap-2 gives it the 16px either side the board's 20 rounds to (§3). -->
        <div class="mx-2 hidden h-7 w-px bg-secondary-400 md:block" />

        <!-- * Three renderings of the same two clusters, one per tier of the ladder in annex §13. The split is CSS-only on purpose: a JS breakpoint would have to resolve before first paint or the header would flicker through the wrong tier on every load. -->
        <!-- * The same subtle neutral as Save: the secondary solid is teal on teal chrome (1.29:1) and the control simply disappears there, where the tan fill reads at 6.65:1 (annex §14.1). -->
        <u-button
          class="hidden lg:inline-flex"
          size="md"
          variant="subtle"
          color="neutral"
          icon="i-lucide-sliders-horizontal"
          label="Story setup"
          @click="storySetupOpen = true"
        />

        <u-tooltip text="Story setup">
          <u-button
            class="hidden md:inline-flex lg:hidden"
            size="md"
            variant="subtle"
            color="neutral"
            icon="i-lucide-sliders-horizontal"
            aria-label="Story setup"
            @click="storySetupOpen = true"
          />
        </u-tooltip>

        <!-- * Bare glyph rather than a button below md, per the mobile artboard: two bordered controls would dominate a 52px bar. The hit area is padded to 44 because this is the only route to episode setup at this width (annex §14.2). -->
        <button
          type="button"
          class="flex size-11 items-center justify-center text-inverted md:hidden"
          aria-label="Story setup"
          @click="storySetupOpen = true"
        >
          <u-icon name="i-lucide-sliders-horizontal" class="size-5" />
        </button>

        <!-- ! Client-only: BuildManager renders localStorage state (saved builds, active build), which the server cannot know. Rendering it during SSR makes the client's first render disagree with the server's, and because the trees then differ by an instance, Reka's useId counter drifts and every id below this point mismatches too. -->
        <ClientOnly>
          <BuildManager class="hidden lg:flex" />
          <BuildManager class="hidden md:flex lg:hidden" :labelled="false" />
        </ClientOnly>
      </template>
    </u-header>

    <u-main>
      <NuxtPage />
    </u-main>

    <!-- * The mobile action bar (annex §13): the three primary build actions leave the header below md and land where a thumb reaches them. -->
    <ClientOnly>
      <div
        class="shrink-0 border-t-2 border-secondary-950 bg-secondary-800 p-3 md:hidden"
      >
        <BuildManager block size="lg" />
      </div>
    </ClientOnly>

    <!-- * Mounted once, outside the header: the controls that open these render in more than one place. Client-only for the same reason BuildManager is — they read localStorage state. -->
    <ClientOnly>
      <BuildDialogs />
    </ClientOnly>

    <StorySetupDrawer v-model:open="storySetupOpen" />
  </u-app>
</template>

<script setup lang="ts">
await useFetch('/api/heroes', { key: 'heroes' });

// ---

const { initialize, setupBeforeUnload } = useHeroPlanner();

// * Ephemeral by contract (feature 003): owned by the shell, not persisted and not addressable by URL. It lives here rather than in the drawer because three separate triggers across the tier ladder open the same panel.
const storySetupOpen = ref(false);

onMounted(async () => {
  await initialize();
  setupBeforeUnload();
});

// ---

useHead({
  meta: [{ name: 'viewport', content: 'width=device-width, initial-scale=1' }],
  link: [{ rel: 'icon', href: '/favicon.ico' }],
  htmlAttrs: {
    lang: 'en'
  }
});

const title = 'Z-Team Planner';
const description =
  'A build calculator for Dispatch. Plan your Z-Team ahead of time: level heroes, train powers and flight, pick synergy pairs, and mirror your story choices. Builds save in your browser and share as a link.';

// ! No ogImage or twitterImage: the starter's pointed at a Nuxt UI template screenshot, and this project has no share image of its own yet. A wrong picture is worse than none, so the cards fall back to text until one exists.
useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description,
  twitterCard: 'summary'
});
</script>
