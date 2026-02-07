<template>
  <UTabs :items="tabs" class="w-full">
    <template #overview>
      <div class="flex flex-wrap justify-center gap-4 p-4">
        <HeroCard
          v-for="hero in visibleHeroes"
          :key="hero.id"
          :hero="hero"
          :stat-bonuses="getStatBonuses(hero.id)"
          :points-remaining="MAX_LEVEL_UPS - totalAssigned(hero.id)"
          @stat-up="statUp(hero.id, $event)"
          @stat-down="statDown(hero.id, $event)"
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
</template>

<script setup lang="ts">
import HeroCard from '~/components/HeroCard.vue';
import { MAX_LEVEL_UPS } from '~/types/hero';

const tabs = [
  { label: 'Overview', slot: 'overview' },
  { label: 'Synergy pairs', slot: 'synergy-pairs' },
  { label: 'Mission simulator', slot: 'mission-simulator' }
];

const { visibleHeroes, getStatBonuses, totalAssigned, statUp, statDown } =
  useHeroPlanner();
</script>
