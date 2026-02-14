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
            :hero="hero"
            :stat-bonuses="getStatBonuses(hero.id)"
            :special-power-bonus="getSpecialPowerBonusStats(hero.id)"
            :points-remaining="
              MAX_LEVEL_UPS + getBonusLevel(hero.id) - totalAssigned(hero.id)
            "
            :power-states="getPowerState(hero.id)"
            :special-power-state="getSpecialPowerState(hero.id)"
            :is-ep8-recruit="isEp8Recruit(hero.id as HeroId)"
            :trainings-full="trainingsUsed >= MAX_POWER_TRAININGS"
            :flight-active="getFlightState(hero.id)"
            :flights-full="flightTrainingsUsed >= MAX_FLIGHT_TRAININGS"
            :bonus-level="getBonusLevel(hero.id)"
            :bonus-full="bonusLevelsUsed >= MAX_BONUS_POINTS"
            @stat-up="statUp(hero.id, $event)"
            @stat-down="statDown(hero.id, $event)"
            @reset-hero="resetHero(hero.id)"
            @toggle-power="togglePower(hero.id, $event)"
            @toggle-flight="toggleFlight(hero.id)"
            @toggle-special-power="toggleSpecialPower(hero.id)"
            @increment-bonus="incrementBonusLevel(hero.id)"
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
          :special-power-bonus="getSpecialPowerBonusStats(hero.id)"
          :points-remaining="
            MAX_LEVEL_UPS + getBonusLevel(hero.id) - totalAssigned(hero.id)
          "
          :power-states="getPowerState(hero.id)"
          :special-power-state="getSpecialPowerState(hero.id)"
          :is-ep8-recruit="isEp8Recruit(hero.id as HeroId)"
          :trainings-full="trainingsUsed >= MAX_POWER_TRAININGS"
          :flight-active="getFlightState(hero.id)"
          :flights-full="flightTrainingsUsed >= MAX_FLIGHT_TRAININGS"
          :bonus-level="getBonusLevel(hero.id)"
          :bonus-full="bonusLevelsUsed >= MAX_BONUS_POINTS"
          @stat-up="statUp(hero.id, $event)"
          @stat-down="statDown(hero.id, $event)"
          @reset-hero="resetHero(hero.id)"
          @toggle-power="togglePower(hero.id, $event)"
          @toggle-flight="toggleFlight(hero.id)"
          @toggle-special-power="toggleSpecialPower(hero.id)"
          @increment-bonus="incrementBonusLevel(hero.id)"
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
  MAX_FLIGHT_TRAININGS,
  MAX_BONUS_POINTS,
  BASE_SYNERGY_PAIRS,
  CONDITIONAL_SYNERGY_PAIRS
} from '~/types/hero';
import type { HeroId } from '~/types/hero';

const tabs = [
  { label: 'Overview', slot: 'overview' },
  { label: 'Synergy pairs', slot: 'synergy-pairs' },
  { label: 'Mission simulator (coming soon!)', slot: 'mission-simulator' }
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
  resetHero,
  getPowerState,
  togglePower,
  trainingsUsed,
  isEp8Recruit,
  getFlightState,
  toggleFlight,
  flightTrainingsUsed,
  getSpecialPowerState,
  toggleSpecialPower,
  getSpecialPowerBonusStats,
  getBonusLevel,
  incrementBonusLevel,
  bonusLevelsUsed
} = useHeroPlanner();

const synergyPairDefs = computed((): [HeroId, HeroId][] => {
  const pairs: [HeroId, HeroId][] = BASE_SYNERGY_PAIRS.map((pair) => [
    pair.hero1,
    pair.hero2
  ]);

  // Determine which conditional pair to use based on episode choices
  const conditionalKey =
    `${ep3Cut.value}-cut-${ep4Hire.value}-hired` as keyof typeof CONDITIONAL_SYNERGY_PAIRS;

  if (conditionalKey in CONDITIONAL_SYNERGY_PAIRS) {
    const conditionalPair = CONDITIONAL_SYNERGY_PAIRS[conditionalKey];
    pairs.push([conditionalPair.hero1, conditionalPair.hero2]);
  }

  return pairs;
});

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
  if (!showEp8Recruits.value) {
    return [];
  }

  const pairHeroIds = new Set<string>(synergyPairDefs.value.flat());

  return visibleHeroes.value.filter((h) => !pairHeroIds.has(h.id));
});
</script>
