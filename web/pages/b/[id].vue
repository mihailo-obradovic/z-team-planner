<template>
  <div v-if="isPending" class="flex h-full flex-col gap-4 p-4">
    <u-skeleton class="h-10 w-72" />

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
      class="flex flex-col items-start justify-between gap-3 p-4 panel sm:flex-row sm:items-center"
    >
      <div class="flex flex-col gap-1">
        <span class="font-heading text-label text-secondary-300 uppercase">
          Shared build
        </span>

        <span class="text-lg font-semibold text-highlighted">{{
          build.name
        }}</span>
      </div>

      <u-button
        color="primary"
        icon="i-lucide-copy"
        :loading="isSaving"
        @click="handleSaveCopy"
      >
        Save a copy
      </u-button>
    </div>

    <!-- * Read-only at one boundary rather than a disabled prop on forty controls: `inert` takes the whole region out of the tab order and blocks pointer and keyboard input. It does not stop a scripted `.click()`, which still reaches a handler — but the guarantee that matters is structural: this page has no write path to the owner's build, only "Save a copy", which creates a new one. -->
    <div
      class="pointer-events-none select-none"
      inert
      aria-readonly="true"
      data-testid="readonly-planner"
    >
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
  </div>
</template>

<script setup lang="ts">
import HeroCard from '@/components/HeroCard.vue';

import { useCreateBuild } from '@/services/queries/useBuildQueries';
import { useFetchSharedBuild } from '@/services/queries/useSharedQueries';

import type { HeroId } from '@/types/hero';

const route = useRoute();
const toast = useToast();

const id = computed(() => route.params.id as string);

// * A 404 becomes the error page rather than a toast — the central policy routes it that way for `/b/…` because a dead share link is a page-level outcome (feature 007).
const { data: build, isPending } = useFetchSharedBuild(id);

const { isSignedIn } = storeToRefs(useAuthStore());
const { synergyPairColumns, loadSharedBuild, saveSharedAsMyBuild } =
  useHeroPlanner();

const { mutate: createBuild, isLoading: isSaving } = useCreateBuild({
  onSuccess: (created) => {
    toast.add({ title: `Saved as "${created.name}"`, color: 'success' });
  }
});

watch(
  build,
  async (next) => {
    if (next) {
      await loadSharedBuild(next.data);
    }
  },
  { immediate: true }
);

function handleSaveCopy() {
  if (!build.value) {
    return;
  }

  // * Signed in it becomes an account build; signed out it falls back to feature 001's local save, so the link is useful without an account (feature 007).
  if (isSignedIn.value) {
    createBuild({ name: build.value.name, data: build.value.data });

    return;
  }

  saveSharedAsMyBuild(build.value.name);
  toast.add({ title: 'Saved to this browser', color: 'success' });
}

useSeoMeta({
  title: () =>
    build.value ? `${build.value.name} — Z-Team Planner` : 'Z-Team Planner',
  // * Unlisted-by-id is the only access control on a share link, so it must never be indexed.
  robots: 'noindex, nofollow'
});
</script>
