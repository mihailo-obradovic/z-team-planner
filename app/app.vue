<template>
  <u-app>
    <u-header mode="slideover" :menu="{ side: 'right', inset: false }">
      <template #left> Z-Team Planner </template>

      <template #default>
        <PlannerFilters orientation="horizontal" />
      </template>

      <template #body>
        <PlannerFilters orientation="vertical" />
      </template>

      <template #right>
        <BuildManager />

        <u-color-mode-button />
      </template>
    </u-header>

    <NuxtImg
      src="/images/background.png"
      class="pointer-events-none fixed inset-0 h-full w-full object-cover opacity-20"
      alt=""
    />

    <u-main class="relative z-10">
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
  'A production-ready starter template powered by Nuxt UI. Build beautiful, accessible, and performant applications in minutes, not hours.';

useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description,
  ogImage: 'https://ui.nuxt.com/assets/templates/nuxt/starter-light.png',
  twitterImage: 'https://ui.nuxt.com/assets/templates/nuxt/starter-light.png',
  twitterCard: 'summary_large_image'
});
</script>
