<template>
  <UTabs
    :items="tabs"
    default-value="overview"
    class="flex h-full w-full flex-col"
    variant="link"
    :ui="{
      root: 'gap-0',
      list: 'shrink-0',
      content: 'min-h-0 flex-1 overflow-y-auto'
    }"
  >
    <template #default="{ item }">
      <span class="sm:hidden">{{ item.shortLabel }}</span>
      <span class="hidden sm:inline">{{ item.label }}</span>
    </template>

    <template #overview>
      <div class="flex flex-col gap-4 p-4">
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
      <div class="p-4" />
    </template>

    <template #mission-simulator>
      <div class="p-4" />
    </template>
  </UTabs>

  <HeroDetailDialog :hero-id="selectedHeroId" @close="handleCloseDetail" />
</template>

<script setup lang="ts">
import HeroCard from '@/components/HeroCard.vue';
import HeroDetailDialog from '@/components/HeroDetailDialog.vue';

import type { HeroId } from '@/types/hero';

const selectedHeroId = ref<HeroId | null>(null);

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
