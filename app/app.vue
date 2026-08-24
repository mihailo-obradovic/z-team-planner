<template>
  <u-app>
    <u-header
      mode="slideover"
      :menu="{ side: 'right', inset: false }"
      class="shrink-0"
    >
      <template #title>
        <span>Z-Team<span class="text-primary"> Planner</span></span>
      </template>

      <template #default>
        <PlannerFilters orientation="horizontal" />
      </template>

      <template #body>
        <PlannerFilters orientation="vertical" />
      </template>

      <template #right>
        <!-- ! Client-only: BuildManager renders localStorage state (saved builds, active build), which the server cannot know. Rendering it during SSR makes the client's first render disagree with the server's, and because the trees then differ by an instance, Reka's useId counter drifts and every id below this point mismatches too. -->
        <ClientOnly>
          <BuildManager />
        </ClientOnly>
      </template>
    </u-header>

    <u-main>
      <NuxtPage />
    </u-main>
  </u-app>
</template>

<script setup lang="ts">
await useFetch('/api/heroes', { key: 'heroes' });

// ---

const { initialize, setupBeforeUnload } = useHeroPlanner();

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
