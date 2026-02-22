<template>
  <UTabs :items="tabs" class="w-full" variant="link">
    <template #overview>
      <div
        class="grid grid-cols-1 md:grid-cols-[repeat(2,auto)] 2xl:grid-cols-[repeat(4,auto)] justify-items-center justify-center gap-4 p-4"
      >
        <div
          v-for="pair in synergyPairColumns"
          :key="pair.topId"
          class="flex flex-col gap-4"
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
        v-if="ep8RecruitHeroes.length"
        class="flex flex-wrap justify-center gap-4 px-4 pb-4"
      >
        <HeroCard
          v-for="hero in ep8RecruitHeroes"
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
  { label: 'Overview', slot: 'overview' },
  { label: 'Synergy pairs', slot: 'synergy-pairs' },
  { label: 'Mission simulator (coming soon!)', slot: 'mission-simulator' }
];

const { synergyPairColumns, ep8RecruitHeroes } = useHeroPlanner();
</script>
