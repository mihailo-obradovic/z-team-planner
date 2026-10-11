<template>
  <div class="flex min-h-0 flex-1 flex-col">
    <!-- ! One root and nothing beside it, a comment included, or the route transition cannot animate this page and the next one mounts blank (feature 010). The dialog is teleported, so only the tabs are in flow. -->
    <u-tabs
      v-model="activeTabModel"
      :items="tabs"
      class="flex h-full w-full flex-col"
      :unmount-on-hide="false"
      @pointerover="handleTabIntent"
      @focusin="handleTabIntent"
    >
      <template #default="{ item }">
        <span class="sm:hidden">{{ item.shortLabel }}</span>
        <span class="hidden sm:inline">{{ item.label }}</span>
      </template>

      <template #content="{ item }">
        <div
          :ref="observeTabWrapper"
          class="@container flex min-h-full tab-fade flex-col gap-4 p-4"
        >
          <template v-if="item.value === 'overview'">
            <!-- * A pointer or focus over the roster is the intent that fetches the dialog's chunk before the click (decision 017). -->
            <div
              class="grid grid-cols-1 justify-center justify-items-center gap-x-6 gap-y-12 md:grid-cols-[repeat(2,auto)] 2xl:grid-cols-[repeat(4,auto)]"
              @pointerenter.once="preloadDetail"
              @focusin.once="preloadDetail"
            >
              <!-- * The first pair is in view on every load, so its portraits fetch at high priority (feature 028). -->
              <div
                v-for="(pair, index) in synergyPairColumns"
                :key="pair.topId"
                class="flex w-full max-w-92 flex-col gap-2"
              >
                <HeroCard
                  :hero-id="pair.top.id"
                  :priority="index === 0 ? 'high' : 'auto'"
                  @view-detail="() => handleViewDetail(pair.top.id)"
                />

                <u-separator color="secondary" decorative>
                  <u-badge
                    color="warning"
                    variant="outline"
                    icon="i-lucide-link-2"
                  >
                    Synergy
                  </u-badge>
                </u-separator>

                <HeroCard
                  :hero-id="pair.bottom.id"
                  :priority="index === 0 ? 'high' : 'auto'"
                  @view-detail="() => handleViewDetail(pair.bottom.id)"
                />
              </div>
            </div>

            <div
              v-if="showEp8Recruits"
              class="flex flex-col gap-4 md:mx-auto md:w-fit"
            >
              <u-separator color="secondary" decorative>
                <h2
                  class="font-heading text-label text-secondary-300 uppercase"
                >
                  Episode 8 recruits
                </h2>
              </u-separator>

              <div
                class="grid grid-cols-1 justify-center justify-items-center gap-x-6 gap-y-12 md:grid-cols-[repeat(2,auto)]"
              >
                <HeroCard
                  v-for="hero in ep8Recruits"
                  :key="hero.id"
                  :hero-id="hero.id"
                  @view-detail="() => handleViewDetail(hero.id)"
                />
              </div>
            </div>
          </template>

          <!-- * The two heavier tabs mount on their first visit and stay mounted (`unmount-on-hide` is off), each from its own chunk (decision 017). -->
          <div
            v-else-if="item.value === 'synergy-pairs'"
            class="flex flex-wrap justify-center gap-4"
          >
            <template v-if="synergyVisited">
              <SynergyPairCard
                v-for="pair in synergyPairColumns"
                :key="pair.topId"
                :top="pair.top"
                :bottom="pair.bottom"
                @view-detail="handleViewDetail"
              />
            </template>
          </div>

          <!-- * Container widths: a 1280 viewport measures 1238 here, so 77rem is the first split; below 49.5rem the two tracks and their gap (454 + 316 + 16) stop fitting. -->
          <!-- * A grid so the team panel always takes its own row (`col-span-full`) yet keeps its natural width above 77rem. -->
          <!-- ! The first track's 454px floor is the templates panel's width; below it the `Fail ≥` column spills out of the card. -->
          <div
            v-else
            class="grid grid-cols-[auto_auto_auto] justify-center gap-4 @max-[77rem]:mx-auto @max-[77rem]:max-w-298 @max-[77rem]:grid-cols-[minmax(454px,1fr)_1fr] @max-[49.5rem]:grid-cols-1"
          >
            <template v-if="missionVisited">
              <MissionTemplatesPanel />
              <MissionRequirementsPanel />
              <MissionMathPanel
                class="@max-[77rem]:order-1 @max-[77rem]:col-span-full"
              />

              <MissionTeamPanel
                class="col-span-full justify-self-center @max-[77rem]:justify-self-stretch"
                @view-detail="handleViewDetail"
              />
            </template>
          </div>

          <PrivacyLink class="mt-auto" />
        </div>
      </template>
    </u-tabs>

    <!-- * Mounted on the first card opened and kept, so the close transition and the roster state behave as before the split. -->
    <HeroDetailDialog
      v-if="detailOpened"
      :hero-id="selectedHeroId"
      @close="handleCloseDetail"
      @select="handleViewDetail"
    />
  </div>
</template>

<script setup lang="ts">
import PrivacyLink from '@/components/shell/PrivacyLink.vue';
import HeroCard from '@/components/hero/HeroCard.vue';

import type { ComponentPublicInstance } from 'vue';

import type { HeroId } from '@/types/hero';

// * The tab content already fades on mount, so the page itself arrives cut (feature 010).
// ! `css: false`, not `false`: opting out unmounts the transition wrapper, and a wrapper mounted fresh on the way to `/privacy` skips that page's fade.
definePageMeta({ pageTransition: { css: false } });

// * Own chunks, fetched on first use or by the idle preload (decision 017).
const SynergyPairCard = defineAsyncComponent(surfaceLoaders.synergyPairCard);
const HeroDetailDialog = defineAsyncComponent(surfaceLoaders.heroDetailDialog);
const MissionTemplatesPanel = defineAsyncComponent(
  surfaceLoaders.missionTemplatesPanel
);
const MissionRequirementsPanel = defineAsyncComponent(
  surfaceLoaders.missionRequirementsPanel
);
const MissionMathPanel = defineAsyncComponent(surfaceLoaders.missionMathPanel);
const MissionTeamPanel = defineAsyncComponent(surfaceLoaders.missionTeamPanel);

const MISSION_SURFACES = [
  'missionTemplatesPanel',
  'missionRequirementsPanel',
  'missionMathPanel',
  'missionTeamPanel'
] as const;

const tabs = [
  {
    label: 'Overview',
    shortLabel: 'Overview',
    value: 'overview'
  },
  {
    label: 'Synergy pairs',
    shortLabel: 'Synergy',
    value: 'synergy-pairs'
  },
  {
    label: 'Mission simulator',
    shortLabel: 'Missions',
    value: 'mission-simulator'
  }
];

const site = useSiteConfig();

const { activeTab, activeTabModel, initTabFromUrl } = useActiveTab();

const { synergyPairColumns, ep8Recruits, showEp8Recruits } = useHeroPlanner();

const tabWidth = useTabWidth();

const { start: startPortraitPrefetch } = usePortraitPrefetch();

const { preload, start: startSurfacePreload } = useLazySurfaces();

const selectedHeroId = ref<HeroId | null>(null);

const detailOpened = useOpenedOnce(() => selectedHeroId.value !== null);
const synergyVisited = useOpenedOnce(() => activeTab.value === 'synergy-pairs');
const missionVisited = useOpenedOnce(
  () => activeTab.value === 'mission-simulator'
);

// * Every tab's wrapper is observed; a hidden one measures 0, so the visible one is the only entry that writes (feature 028).
const tabWrapperObserver = import.meta.client
  ? new ResizeObserver((entries) => {
      for (const entry of entries) {
        const width = entry.contentBoxSize[0]?.inlineSize ?? 0;

        if (width > 0) {
          tabWidth.value = width;
        }
      }
    })
  : null;

// * nuxt-schema-org has no `defineWebApplication`; the `@type` override merges with its `SoftwareApplication` default.

useSchemaOrg([
  defineSoftwareApp({
    '@type': 'WebApplication',
    name: site.name,
    description: site.description,
    applicationCategory: 'UtilitiesApplication'
  })
]);

function handleViewDetail(id: HeroId) {
  selectedHeroId.value = id;
}

function handleCloseDetail() {
  selectedHeroId.value = null;
}

function preloadDetail() {
  preload('heroDetailDialog');
}

// * Only a tab trigger counts as intent; the root listener sees every pointer and focus event in the page.
function handleTabIntent(event: Event) {
  if (event.target instanceof Element && event.target.closest('[role="tab"]')) {
    preload('synergyPairCard', ...MISSION_SURFACES);
  }
}

function observeTabWrapper(element: Element | ComponentPublicInstance | null) {
  if (element instanceof Element) {
    tabWrapperObserver?.observe(element);
  }
}

onMounted(initTabFromUrl);

onMounted(startPortraitPrefetch);

onMounted(startSurfacePreload);

onUnmounted(() => tabWrapperObserver?.disconnect());
</script>
