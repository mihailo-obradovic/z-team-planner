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
          :power-states="getPowerState(hero.id)"
          :is-ep8-recruit="isEp8Recruit(hero.id as HeroId)"
          :trainings-full="trainingsUsed >= MAX_POWER_TRAININGS"
          :flight-active="getFlightState(hero.id)"
          :flights-full="flightTrainingsUsed >= MAX_FLIGHT_TRAININGS"
          @stat-up="statUp(hero.id, $event)"
          @stat-down="statDown(hero.id, $event)"
          @toggle-power="togglePower(hero.id, $event)"
          @toggle-flight="toggleFlight(hero.id)"
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
import { MAX_LEVEL_UPS, MAX_POWER_TRAININGS, MAX_FLIGHT_TRAININGS } from '~/types/hero';
import type { HeroId } from '~/types/hero';

const tabs = [
  { label: 'Overview', slot: 'overview' },
  { label: 'Synergy pairs', slot: 'synergy-pairs' },
  { label: 'Mission simulator', slot: 'mission-simulator' }
];

const { visibleHeroes, getStatBonuses, totalAssigned, statUp, statDown, getPowerState, togglePower, trainingsUsed, isEp8Recruit, getFlightState, toggleFlight, flightTrainingsUsed } =
  useHeroPlanner();
</script>
