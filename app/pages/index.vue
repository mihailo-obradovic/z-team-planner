<template>
  <div>
    <div class="flex items-center gap-6 mb-4">
      <u-form-field label="Episode 3: Cut">
        <u-select v-model="ep3Cut" :items="ep3CutItems" />
      </u-form-field>

      <u-form-field label="Episode 4: Hire">
        <u-select v-model="ep4Hire" :items="ep4HireItems" />
      </u-form-field>

      <u-form-field label="Episode 8 recruits">
        <u-switch v-model="showEp8Recruits" />
      </u-form-field>
    </div>

    <div
      class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
    >
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
import {
  EP3_CUT_OPTIONS,
  EP4_HIRE_OPTIONS,
  FIXED_LEVEL_HEROES,
  MAX_LEVEL_UPS,
  MAX_STAT_VALUE,
  STAT_NAMES
} from '~/types/hero';
import type { HeroId, HeroStats, StatName } from '~/types/hero';

const { data: heroes } = await useFetch('/api/heroes');

const ep3Cut = ref<HeroId>('sonar');
const ep4Hire = ref<HeroId>('waterboy');
const showEp8Recruits = ref(true);

const ZERO_STATS: HeroStats = Object.fromEntries(
  STAT_NAMES.map((s) => [s, 0])
) as HeroStats;

const heroLevelUps = ref<Partial<Record<HeroId, HeroStats>>>({});

function getStatBonuses(id: HeroId): HeroStats {
  return heroLevelUps.value[id] ?? ZERO_STATS;
}

function totalAssigned(id: HeroId): number {
  const bonuses = getStatBonuses(id);
  return STAT_NAMES.reduce((sum, s) => sum + bonuses[s], 0);
}

function statUp(id: HeroId, stat: StatName) {
  if (id in FIXED_LEVEL_HEROES) return;
  const hero = heroes.value?.find((h) => h.id === id);
  if (!hero) return;

  if (!heroLevelUps.value[id]) heroLevelUps.value[id] = { ...ZERO_STATS };
  const bonuses = heroLevelUps.value[id]!;

  if (totalAssigned(id) >= MAX_LEVEL_UPS) return;
  if (hero.startingStats[stat] + bonuses[stat] >= MAX_STAT_VALUE) return;

  bonuses[stat]++;
}

function statDown(id: HeroId, stat: StatName) {
  if (id in FIXED_LEVEL_HEROES) return;
  if (!heroLevelUps.value[id]) return;
  const bonuses = heroLevelUps.value[id]!;

  if (bonuses[stat] <= 0) return;
  bonuses[stat]--;
}

const ep3CutItems = computed(
  () =>
    heroes.value
      ?.filter((h) =>
        EP3_CUT_OPTIONS.includes(h.id as (typeof EP3_CUT_OPTIONS)[number])
      )
      .map((h) => ({ label: h.name, value: h.id })) ?? []
);

const ep4HireItems = computed(
  () =>
    heroes.value
      ?.filter((h) =>
        EP4_HIRE_OPTIONS.includes(h.id as (typeof EP4_HIRE_OPTIONS)[number])
      )
      .map((h) => ({ label: h.name, value: h.id })) ?? []
);

const visibleHeroes = computed(
  () =>
    heroes.value?.filter((hero) => {
      if (hero.id === ep3Cut.value) return false;
      if (hero.id === 'blonde-blazer') return showEp8Recruits.value;
      if (
        EP4_HIRE_OPTIONS.includes(hero.id as (typeof EP4_HIRE_OPTIONS)[number])
      ) {
        return hero.id === ep4Hire.value || showEp8Recruits.value;
      }
      return true;
    }) ?? []
);
</script>
