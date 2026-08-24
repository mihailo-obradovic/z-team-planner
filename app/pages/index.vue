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
    <template #overview>
      <div
        class="grid grid-cols-1 justify-center justify-items-center gap-4 p-4 md:grid-cols-[repeat(2,auto)] 2xl:grid-cols-[repeat(4,auto)]"
      >
        <div
          v-for="pair in synergyPairColumns"
          :key="pair.topId"
          class="flex w-full max-w-92 flex-col gap-4"
        >
          <HeroCard
            v-for="hero in [pair.top, pair.bottom]"
            :key="hero.id"
            :hero-id="hero.id as HeroId"
            @view-detail="selectedHeroId = hero.id as HeroId"
          />
        </div>
      </div>
      <div
        v-if="showEp8Recruits"
        class="grid grid-cols-1 justify-items-center gap-4 px-4 pb-4 md:grid-cols-[repeat(2,auto)] 2xl:grid-cols-[repeat(3,auto)]"
      >
        <HeroCard
          v-for="hero in ep8Recruits"
          :key="hero.id"
          :hero-id="hero.id as HeroId"
          @view-detail="selectedHeroId = hero.id as HeroId"
        />
      </div>
    </template>

    <template #synergy-pairs>
      <div class="p-4" />
    </template>

    <template #mission-simulator>
      <div class="p-4" />
    </template>
  </UTabs>

  <HeroDetailDialog :hero-id="selectedHeroId" @close="selectedHeroId = null" />
</template>

<script setup lang="ts">
import HeroCard from '@/components/HeroCard.vue';
import HeroDetailDialog from '@/components/HeroDetailDialog.vue';

import type { HeroId } from '@/types/hero';

const selectedHeroId = ref<HeroId | null>(null);

const tabs = [
  { label: 'Overview', value: 'overview', slot: 'overview' },
  { label: 'Synergy pairs', value: 'synergy-pairs', slot: 'synergy-pairs' },
  {
    label: 'Mission simulator (coming soon!)',
    value: 'mission-simulator',
    slot: 'mission-simulator'
  }
];

const { synergyPairColumns, ep8Recruits, showEp8Recruits } = useHeroPlanner();
</script>
