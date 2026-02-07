<template>
  <div>
    <div class="flex items-center gap-6 mb-4">
      <UFormField label="Episode 3: Cut">
        <USelect
          v-model="ep3Cut"
          :items="ep3CutItems"
        />
      </UFormField>

      <UFormField label="Episode 4: Hire">
        <USelect
          v-model="ep4Hire"
          :items="ep4HireItems"
        />
      </UFormField>

      <UFormField label="Episode 8 recruits">
        <USwitch v-model="showEp8Recruits" />
      </UFormField>
    </div>

    <table>
      <thead>
        <tr>
          <th>Stat</th>
          <th
            v-for="hero in visibleHeroes"
            :key="hero.id"
          >
            {{ hero.name }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="stat in STAT_NAMES"
          :key="stat"
        >
          <td class="capitalize">{{ stat }}</td>
          <td
            v-for="hero in visibleHeroes"
            :key="hero.id"
          >
            {{ hero.startingStats[stat] }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { STAT_NAMES, EP3_CUT_OPTIONS, EP4_HIRE_OPTIONS } from '~/types/hero';
import type { HeroId } from '~/types/hero';

const { data: heroes } = await useFetch('/api/heroes');

const ep3Cut = ref<HeroId>('sonar');
const ep4Hire = ref<HeroId>('waterboy');
const showEp8Recruits = ref(false);

const ep3CutItems = computed(() =>
  heroes.value
    ?.filter(h => EP3_CUT_OPTIONS.includes(h.id as typeof EP3_CUT_OPTIONS[number]))
    .map(h => ({ label: h.name, value: h.id })) ?? []
);

const ep4HireItems = computed(() =>
  heroes.value
    ?.filter(h => EP4_HIRE_OPTIONS.includes(h.id as typeof EP4_HIRE_OPTIONS[number]))
    .map(h => ({ label: h.name, value: h.id })) ?? []
);

const visibleHeroes = computed(() =>
  heroes.value?.filter((hero) => {
    if (hero.id === ep3Cut.value) return false;
    if (hero.id === 'blonde-blazer') return showEp8Recruits.value;
    if (EP4_HIRE_OPTIONS.includes(hero.id as typeof EP4_HIRE_OPTIONS[number])) {
      return hero.id === ep4Hire.value || showEp8Recruits.value;
    }
    return true;
  }) ?? []
);
</script>
