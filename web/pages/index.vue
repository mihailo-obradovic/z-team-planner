<template>
  <UTabs
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
    @update:model-value="setActiveTab($event as TabValue)"
  >
    <template #default="{ item }">
      <span class="sm:hidden">{{ item.shortLabel }}</span>
      <span class="hidden sm:inline">{{ item.label }}</span>
    </template>

    <template #overview>
      <div class="flex tab-fade flex-col gap-4 p-4">
        <div
          class="grid grid-cols-1 justify-center justify-items-center gap-x-6 gap-y-12 md:grid-cols-[repeat(2,auto)] 2xl:grid-cols-[repeat(4,auto)]"
        >
          <div
            v-for="pair in synergyPairColumns"
            :key="pair.topId"
            class="flex w-full max-w-92 flex-col gap-2"
          >
            <HeroCard
              :hero-id="pair.top.id as HeroId"
              @viewDetail="handleViewDetail(pair.top.id)"
            />

            <u-separator color="secondary" decorative>
              <u-badge color="warning" variant="outline" icon="i-lucide-link-2">
                Synergy
              </u-badge>
            </u-separator>

            <HeroCard
              :hero-id="pair.bottom.id as HeroId"
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
              :hero-id="hero.id as HeroId"
              @viewDetail="handleViewDetail(hero.id)"
            />
          </div>
        </div>
      </div>
    </template>

    <template #synergy-pairs>
      <div class="@container flex tab-fade flex-wrap justify-center gap-4 p-4">
        <SynergyPairCard
          v-for="pair in synergyPairColumns"
          :key="pair.topId"
          :top="pair.top"
          :bottom="pair.bottom"
          @viewDetail="handleViewDetail"
        />
      </div>
    </template>

    <template #mission-simulator>
      <!-- * The responsive ladder (feature 015), written down in one place: container
           queries on this wrapper, so the rules survive any future page chrome. What they
           measure is this element's *content* box, which `p-4` sits outside of — so every
           threshold is 32px below the viewport width it corresponds to. 78rem (≈1280px
           viewport) splits the top row; 49rem (≈816px) takes everything to a single
           column. The two thresholds below that — 35rem for the team, 28.5rem for the
           templates and the requirements check — live in those components. -->
      <div class="@container tab-fade p-4">
        <!-- * A grid, not a wrapping flex row: the team has to take a row of its own at
             every width while staying its own natural width above 78rem, and only grid
             separates those two — `col-span-full` breaks the row, `justify-self` decides
             whether it fills it. Below 78rem it fills, matching the first row, which now
             fills too; the whole stack is capped at the width the three panels occupy
             above the threshold so nothing jumps across it. The math panel's `order-1` is
             the ladder's only reordering: it slides past the team to the third row. -->
        <div
          class="grid grid-cols-[auto_auto_auto] justify-center gap-4 @max-[78rem]:mx-auto @max-[78rem]:max-w-[74.5rem] @max-[78rem]:grid-cols-2 @max-[49rem]:grid-cols-1"
        >
          <MissionTemplatesPanel />
          <MissionRequirementsPanel />
          <MissionMathPanel
            class="@max-[78rem]:order-1 @max-[78rem]:col-span-full"
          />

          <MissionTeamPanel
            class="col-span-full justify-self-center @max-[78rem]:justify-self-stretch"
            @viewDetail="handleViewDetail"
          />
        </div>
      </div>
    </template>
  </UTabs>

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

const selectedHeroId = ref<HeroId | null>(null);

const { activeTab, initTabFromUrl, setActiveTab } = useActiveTab();

onMounted(initTabFromUrl);

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

const { synergyPairColumns, ep8Recruits, showEp8Recruits } = useHeroPlanner();

function handleViewDetail(id: HeroId) {
  selectedHeroId.value = id;
}

function handleCloseDetail() {
  selectedHeroId.value = null;
}
</script>
