<template>
  <UTabs :items="tabs" class="w-full">
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
      </div>
      <div
        v-if="ep8RecruitHeroes.length"
        class="flex flex-wrap justify-center gap-4 px-4 pb-4"
      >
        <HeroCard
          v-for="hero in ep8RecruitHeroes"
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
import {
  MAX_LEVEL_UPS,
  MAX_POWER_TRAININGS,
  MAX_FLIGHT_TRAININGS
} from '~/types/hero';
import type { HeroId } from '~/types/hero';

const tabs = [
  { label: 'Overview', slot: 'overview' },
  { label: 'Synergy pairs', slot: 'synergy-pairs' },
  { label: 'Mission simulator', slot: 'mission-simulator' }
];

const {
  visibleHeroes,
  ep3Cut,
  ep4Hire,
  showEp8Recruits,
  getStatBonuses,
  totalAssigned,
  statUp,
  statDown,
  getPowerState,
  togglePower,
  trainingsUsed,
  isEp8Recruit,
  getFlightState,
  toggleFlight,
  flightTrainingsUsed
} = useHeroPlanner();

const synergyPairDefs = computed((): [HeroId, HeroId][] => [
  ['flambae', 'prism'],
  ['golem', 'invisigal'],
  ['malevola', ep3Cut.value === 'sonar' ? ep4Hire.value : 'sonar'],
  ['punch-up', ep3Cut.value === 'coupe' ? ep4Hire.value : 'coupe']
]);

const synergyPairColumns = computed(() => {
  const heroMap = new Map(visibleHeroes.value.map((h) => [h.id, h]));
  const pairs = [];
  for (const [topId, bottomId] of synergyPairDefs.value) {
    const top = heroMap.get(topId);
    const bottom = heroMap.get(bottomId);
    if (top && bottom) {
      pairs.push({ topId, top, bottom });
    }
  }
  return pairs;
});

const ep8RecruitHeroes = computed(() => {
  if (!showEp8Recruits.value) return [];
  const pairHeroIds = new Set<string>(synergyPairDefs.value.flat());
  return visibleHeroes.value.filter((h) => !pairHeroIds.has(h.id));
});
</script>
