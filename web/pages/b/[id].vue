<template>
  <div v-if="isPending" class="flex h-full flex-col gap-4 p-4">
    <u-skeleton class="h-8 w-64" />

    <div
      class="grid grid-cols-1 justify-center justify-items-center gap-x-6 gap-y-12 md:grid-cols-[repeat(2,auto)] 2xl:grid-cols-[repeat(4,auto)]"
    >
      <u-skeleton
        v-for="index in 8"
        :key="index"
        class="h-64 w-full max-w-92"
      />
    </div>
  </div>

  <div v-else-if="build" class="flex flex-col gap-4 p-4">
    <div
      class="grid grid-cols-1 justify-center justify-items-center gap-x-6 gap-y-12 md:grid-cols-[repeat(2,auto)] 2xl:grid-cols-[repeat(4,auto)]"
    >
      <div
        v-for="pair in synergyPairColumns"
        :key="pair.topId"
        class="flex w-full max-w-92 flex-col gap-2"
      >
        <HeroCard :hero-id="pair.top.id as HeroId" />

        <u-separator color="secondary" decorative>
          <u-badge color="warning" variant="outline" icon="i-lucide-link-2">
            Synergy
          </u-badge>
        </u-separator>

        <HeroCard :hero-id="pair.bottom.id as HeroId" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import HeroCard from '@/components/HeroCard.vue';

import { useFetchSharedBuild } from '@/services/queries/useSharedQueries';

import type { HeroId } from '@/types/hero';

const route = useRoute();

const id = computed(() => route.params.id as string);

// * A 404 becomes the error page rather than a toast — the central policy routes it that way
// * for `/b/…` because a dead share link is a page-level outcome (feature 006).
const { data: build, isPending } = useFetchSharedBuild(id);

const { synergyPairColumns, loadSharedBuild } = useHeroPlanner();

watch(
  build,
  async (next) => {
    if (next) {
      await loadSharedBuild(next.data);
    }
  },
  { immediate: true }
);

useSeoMeta({
  title: () =>
    build.value ? `${build.value.name} — Z-Team Planner` : 'Z-Team Planner',
  // * Unlisted-by-id is the only access control on a share link, so it must never be indexed.
  robots: 'noindex, nofollow'
});
</script>
