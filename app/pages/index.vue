<template>
  <div>
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
  </div>
</template>

<script setup lang="ts">
import HeroCard from '~/components/HeroCard.vue';
import { MAX_LEVEL_UPS } from '~/types/hero';

const { visibleHeroes, getStatBonuses, totalAssigned, statUp, statDown } =
  useHeroPlanner();
</script>
