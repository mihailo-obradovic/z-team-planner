<template>
  <u-tabs
    :items="tabs"
    :model-value="activeTab"
    class="flex h-full w-full flex-col"
    variant="link"
    :unmount-on-hide="false"
    :ui="{
      root: 'gap-0',
      list: 'shrink-0',
      content: 'min-h-0 flex-1 overflow-y-auto'
    }"
    @update:model-value="handleTabChange"
  >
    <template #default="{ item }">
      <span class="sm:hidden">{{ item.shortLabel }}</span>
      <span class="hidden sm:inline">{{ item.label }}</span>
    </template>

    <template #overview>
      <!-- * `min-h-full` with `mt-auto` on the line keeps it at the panel's bottom until the content is taller, in all three tabs (feature 010). -->
      <div class="flex min-h-full tab-fade flex-col gap-4 p-4">
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
              @viewDetail="handleViewDetail(pair.top.id)"
            />

            <u-separator color="secondary" decorative>
              <u-badge color="warning" variant="outline" icon="i-lucide-link-2">
                Synergy
              </u-badge>
            </u-separator>

            <HeroCard
              :hero-id="pair.bottom.id"
              @viewDetail="handleViewDetail(pair.bottom.id)"
            />
          </div>
        </div>

        <div
          v-if="showEp8Recruits"
          class="flex flex-col gap-4 md:mx-auto md:w-fit"
        >
          <u-separator color="secondary" decorative>
            <h2 class="font-heading text-label text-secondary-300 uppercase">
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
              @viewDetail="handleViewDetail(hero.id)"
            />
          </div>
        </div>

        <PrivacyLink class="mt-auto" />
      </div>
    </template>

    <template #synergy-pairs>
      <div class="@container flex min-h-full tab-fade flex-col gap-4 p-4">
        <div class="flex flex-wrap justify-center gap-4">
          <SynergyPairCard
            v-for="pair in synergyPairColumns"
            :key="pair.topId"
            :top="pair.top"
            :bottom="pair.bottom"
            @viewDetail="handleViewDetail"
          />
        </div>

        <PrivacyLink class="mt-auto" />
      </div>
    </template>

    <template #mission-simulator>
      <!-- * The responsive ladder's container queries measure this wrapper's content box, which sits 42px under the viewport once `p-4` and main's scrollbar are taken (feature 015). -->
      <!-- * 77rem is the first split because a 1280 viewport measures 1238 here; 49.5rem is where the two tracks and their gap (454 + 316 + 16) stop fitting. The team's and templates' own thresholds live in those components. -->
      <div class="@container flex min-h-full tab-fade flex-col gap-4 p-4">
        <!-- * A grid, because only grid lets the team take its own row at every width while keeping its natural width above 77rem: `col-span-full` breaks the row and `justify-self` decides whether it fills. The math panel's `order-1` is the ladder's only reordering. -->
        <!-- ! The first track's 454px floor is the templates panel's own width: with two equal `1fr` tracks under ~876px, its `Fail ≥` column silently spills out of the card. -->
        <div
          class="grid grid-cols-[auto_auto_auto] justify-center gap-4 @max-[77rem]:mx-auto @max-[77rem]:max-w-298 @max-[77rem]:grid-cols-[minmax(454px,1fr)_1fr] @max-[49.5rem]:grid-cols-1"
        >
          <MissionTemplatesPanel />
          <MissionRequirementsPanel />
          <MissionMathPanel
            class="@max-[77rem]:order-1 @max-[77rem]:col-span-full"
          />

          <MissionTeamPanel
            class="col-span-full justify-self-center @max-[77rem]:justify-self-stretch"
            @viewDetail="handleViewDetail"
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
</template>

<script setup lang="ts">
import HeroCard from '@/components/HeroCard.vue';
import SynergyPairCard from '@/components/SynergyPairCard.vue';
import HeroDetailDialog from '@/components/HeroDetailDialog.vue';
import MissionTemplatesPanel from '@/components/mission/MissionTemplatesPanel.vue';
import MissionRequirementsPanel from '@/components/mission/MissionRequirementsPanel.vue';
import MissionMathPanel from '@/components/mission/MissionMathPanel.vue';
import MissionTeamPanel from '@/components/mission/MissionTeamPanel.vue';

import type { HeroId } from '@/types/hero';
import type { TabValue } from '@/composables/useActiveTab';

const tabs = [
  {
    label: 'Overview',
    shortLabel: 'Overview',
    value: 'overview',
    slot: 'overview'
  },
  {
    label: 'Synergy pairs',
    shortLabel: 'Synergy',
    value: 'synergy-pairs',
    slot: 'synergy-pairs'
  },
  {
    label: 'Mission simulator',
    shortLabel: 'Missions',
    value: 'mission-simulator',
    slot: 'mission-simulator'
  }
];

const site = useSiteConfig();

const { activeTab, initTabFromUrl, setActiveTab } = useActiveTab();

const { synergyPairColumns, ep8Recruits, showEp8Recruits } = useHeroPlanner();

const selectedHeroId = ref<HeroId | null>(null);

// * `WebApplication` is set explicitly because nuxt-schema-org has no `defineWebApplication`; the resolver merges it with its `SoftwareApplication` default (feature 027).

useSchemaOrg([
  defineSoftwareApp({
    '@type': 'WebApplication',
    name: site.name,
    description: site.description,
    applicationCategory: 'UtilitiesApplication'
  })
]);

// * UTabs models its value as string | number; the tab union is ours, so it is narrowed here rather than cast in the template.
function handleTabChange(value: string | number) {
  setActiveTab(value as TabValue);
}

function handleViewDetail(id: HeroId) {
  selectedHeroId.value = id;
}

function handleCloseDetail() {
  selectedHeroId.value = null;
}

onMounted(initTabFromUrl);
</script>
