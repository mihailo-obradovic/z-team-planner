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

  <div
    v-else-if="sharedBuild"
    class="@container flex min-h-full flex-col gap-4 p-4"
  >
    <!-- ! Comments live inside the branches: one between `v-if` and `v-else-if` becomes part of the branch in dev, the page renders as a fragment, and the route transition leaves the next page blank (as `index.vue` notes). -->
    <!-- * `min-h-full` with `mt-auto` on the line keeps it at the bottom until the build is taller (feature 010). -->
    <!-- * `@container` so the cards read this wrapper the way they read the planner's tab wrapper (HeroCard's gap step). -->
    <div
      class="flex panel flex-col items-start justify-between gap-3 bg-default p-4 sm:flex-row sm:items-center"
    >
      <div class="flex flex-col gap-1">
        <!-- ! `text-muted`, not `secondary-300`: this band is paper, where `secondary-300` measures 1.78:1 (annex §14.1). -->
        <span class="font-heading text-label text-muted uppercase">
          Shared build
        </span>

        <span class="text-lg font-semibold text-highlighted">{{
          sharedBuild.name
        }}</span>
      </div>

      <u-button
        color="primary"
        icon="i-lucide-copy"
        :loading="isSaving || !isDestinationKnown"
        :disabled="isCopied"
        @click="handleSaveCopy"
      >
        Save a copy
      </u-button>
    </div>

    <!-- * The cards' read-only form, never an `inert` wrapper: `inert` would hide the whole build from assistive technology (composition rules, Read-only regions). A `readonly` prop stops human input, not a scripted dispatch; the real guarantee is that this page has no write path to the owner's build. -->
    <div
      class="grid grid-cols-1 justify-center justify-items-center gap-x-6 gap-y-12 md:grid-cols-[repeat(2,auto)] 2xl:grid-cols-[repeat(4,auto)]"
      data-testid="readonly-planner"
    >
      <div
        v-for="pair in synergyPairColumns"
        :key="pair.topId"
        class="flex w-full max-w-92 flex-col gap-2"
      >
        <HeroCard :hero-id="pair.top.id" readonly />

        <u-separator color="secondary" decorative>
          <u-badge color="warning" variant="outline" icon="i-lucide-link-2">
            Synergy
          </u-badge>
        </u-separator>

        <HeroCard :hero-id="pair.bottom.id" readonly />
      </div>
    </div>

    <PrivacyLink class="mt-auto" />
  </div>
</template>

<script setup lang="ts">
import PrivacyLink from '@/components/shell/PrivacyLink.vue';
import HeroCard from '@/components/hero/HeroCard.vue';

import { useCreateBuild } from '@/services/queries/useBuildQueries';

import type { BuildLocation } from '@/composables/build/useBuildToast';

const route = useRoute();
const { reportBuild } = useBuildToast();

const id = computed(() => route.params.id as string);

// * Every failure of this read ends on the error page, so the template needs no third branch: a dead share link through the central policy, anything else through `useSharedBuild` (feature 007).
const { data: sharedBuild, isPending } = useSharedBuild(id);

const { isSignedIn, isDestinationKnown } = storeToRefs(useAuthStore());
const { synergyPairColumns } = useHeroPlanner();
const { saveAsNewLocalBuild } = useLocalBuilds();
const { openCloud } = useOpenBuild();
const { updateSavedSnapshot } = useUnsavedChanges();
const { leaveSharedMode } = useBuildMode();
const { guardDiscard } = useDiscardGuard();
const { setPlannerAside, restorePlanner, dropSetAside } = usePlannerSetAside();

const plannerState = usePlannerState();

// * Set once a copy exists: the page is on its way to `/`, and a second click would make a second copy.
const isCopied = ref(false);

const { mutate: createBuild, isLoading: isSaving } = useCreateBuild({
  onSuccess: async (created, { data }) => {
    openCloud(created.id);
    // * A `?build=` snapshot the visitor had on `/` is replaced by the copy, not returned to.
    leaveSharedMode();
    updateSavedSnapshot(data);
    await finishCopy(created.name, 'cloud');
  }
});

watch(
  sharedBuild,
  async (next) => {
    if (next) {
      setPlannerAside();
      await deserializeBuild(next.data, plannerState);
    }
  },
  { immediate: true }
);

// * Leaving without a copy hands the visitor's planner back exactly as it was (feature 029).
onBeforeRouteLeave(async () => {
  await restorePlanner();
});

function handleSaveCopy() {
  if (
    !sharedBuild.value ||
    isSaving.value ||
    isCopied.value ||
    !isDestinationKnown.value
  ) {
    return;
  }

  guardDiscard(saveCopy);
}

function saveCopy() {
  const build = sharedBuild.value;

  if (!build) {
    return;
  }

  // * Signed in it becomes an account build; signed out it falls back to feature 001's local save, so the link is useful without an account (feature 007).
  if (isSignedIn.value) {
    createBuild({ name: build.name, data: build.data });

    return;
  }

  // * The planner already holds the shared build, so the local save writes exactly it.
  void finishCopy(saveAsNewLocalBuild(build.name), 'local');
}

// * The copy is open and the planner holds it: nothing is left to restore, and `/` shows it.
async function finishCopy(name: string, location: BuildLocation) {
  isCopied.value = true;
  dropSetAside();
  reportBuild('copied', name, location);
  await navigateTo('/');
}

useSeoMeta({
  title: () =>
    sharedBuild.value
      ? `${sharedBuild.value.name} — Z-Team Planner`
      : 'Z-Team Planner',
  // * Unlisted-by-id is the only access control on a share link, so it must never be indexed.
  robots: 'noindex, nofollow'
});
</script>
