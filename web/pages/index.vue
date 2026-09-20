<template>
  <div class="flex min-h-0 flex-1 flex-col">
    <!-- ! One root and nothing beside it, a comment included, or the route transition cannot animate this page and the next one mounts blank (feature 010). The dialog is teleported, so only the tabs are in flow. -->
    <u-tabs
      v-model="activeTabModel"
      :items="tabs"
      class="flex h-full w-full flex-col"
      :unmount-on-hide="false"
    >
      <template #default="{ item }">
        <span class="sm:hidden">{{ item.shortLabel }}</span>
        <span class="hidden sm:inline">{{ item.label }}</span>
      </template>

      <template #content="{ item }">
        <div class="@container flex min-h-full tab-fade flex-col gap-4 p-4">
          <template v-if="item.value === 'overview'">
            <div
              class="grid grid-cols-1 justify-center justify-items-center gap-x-6 gap-y-12 md:grid-cols-[repeat(2,auto)] 2xl:grid-cols-[repeat(4,auto)]"
            >
              <div
                v-for="pair in synergyPairColumns"
                :key="pair.topId"
                class="flex w-full max-w-92 flex-col gap-2"
              >
                <HeroCard
                  :hero-id="pair.top.id"
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

          <div
            v-else-if="item.value === 'synergy-pairs'"
            class="flex flex-wrap justify-center gap-4"
          >
            <SynergyPairCard
              v-for="pair in synergyPairColumns"
              :key="pair.topId"
              :top="pair.top"
              :bottom="pair.bottom"
              @view-detail="handleViewDetail"
            />
          </div>

          <!-- * Container widths: a 1280 viewport measures 1238 here, so 77rem is the first split; below 49.5rem the two tracks and their gap (454 + 316 + 16) stop fitting. -->
          <!-- * A grid so the team panel always takes its own row (`col-span-full`) yet keeps its natural width above 77rem. -->
          <!-- ! The first track's 454px floor is the templates panel's width; below it the `Fail ≥` column spills out of the card. -->
          <div
            v-else
            class="grid grid-cols-[auto_auto_auto] justify-center gap-4 @max-[77rem]:mx-auto @max-[77rem]:max-w-298 @max-[77rem]:grid-cols-[minmax(454px,1fr)_1fr] @max-[49.5rem]:grid-cols-1"
          >
            <MissionTemplatesPanel />
            <MissionRequirementsPanel />
            <MissionMathPanel
              class="@max-[77rem]:order-1 @max-[77rem]:col-span-full"
            />

            <MissionTeamPanel
              class="col-span-full justify-self-center @max-[77rem]:justify-self-stretch"
              @view-detail="handleViewDetail"
            />
          </div>

          <PrivacyLink class="mt-auto" />
        </div>
      </template>
    </u-tabs>

    <HeroDetailDialog
      :hero-id="selectedHeroId"
      @close="handleCloseDetail"
      @select="handleViewDetail"
    />
  </div>
</template>

<script setup lang="ts">
import PrivacyLink from '@/components/shell/PrivacyLink.vue';
import HeroCard from '@/components/hero/HeroCard.vue';
import SynergyPairCard from '@/components/synergy/SynergyPairCard.vue';
import HeroDetailDialog from '@/components/hero/HeroDetailDialog.vue';
import MissionTemplatesPanel from '@/components/mission/MissionTemplatesPanel.vue';
import MissionRequirementsPanel from '@/components/mission/MissionRequirementsPanel.vue';
import MissionMathPanel from '@/components/mission/MissionMathPanel.vue';
import MissionTeamPanel from '@/components/mission/MissionTeamPanel.vue';

import type { HeroId } from '@/types/hero';

// * The tab content already fades on mount, so the page itself arrives cut (feature 010).
// ! `css: false`, not `false`: opting out unmounts the transition wrapper, and a wrapper mounted fresh on the way to `/privacy` skips that page's fade.
definePageMeta({ pageTransition: { css: false } });

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

const { activeTabModel, initTabFromUrl } = useActiveTab();

const { synergyPairColumns, ep8Recruits, showEp8Recruits } = useHeroPlanner();

const selectedHeroId = ref<HeroId | null>(null);

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

onMounted(initTabFromUrl);
</script>
