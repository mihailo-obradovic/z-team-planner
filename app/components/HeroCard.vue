<template>
  <div
    class="flex gap-4 rounded-lg border border-default bg-elevated p-4 w-104 justify-between"
  >
    <NuxtImg
      :src="`/portraits/${hero.id}.webp`"
      :alt="hero.name"
      class="aspect-square size-48 rounded-md bg-accented object-cover"
    />

    <div class="flex flex-col">
      <div class="flex items-center justify-between mb-2">
        <h3 class="text-lg font-semibold">{{ hero.name }}</h3>
        <span class="text-sm text-muted ml-4">Lv. {{ heroLevel }}</span>
      </div>

      <ul class="flex flex-1 flex-col justify-between text-sm">
        <li
          v-for="stat in STAT_NAMES"
          :key="stat"
          class="flex items-center justify-between"
        >
          <span class="capitalize text-muted flex items-center gap-2">
            <NuxtImg
              :src="`/stat-icons/${stat}.webp`"
              :alt="stat"
              class="size-4"
            />
            {{ stat }}
          </span>
          <div class="flex items-center gap-1 ml-4">
            <template v-if="canLevelUp">
              <UButton
                icon="i-lucide-minus"
                size="xs"
                variant="soft"
                color="neutral"
                :disabled="statBonuses[stat] <= 0"
                @click="$emit('statDown', stat)"
              />
            </template>
            <span class="font-medium w-5 text-center">{{
              hero.startingStats[stat] + statBonuses[stat]
            }}</span>
            <template v-if="canLevelUp">
              <UButton
                icon="i-lucide-plus"
                size="xs"
                variant="soft"
                color="neutral"
                :disabled="
                  pointsRemaining <= 0 ||
                  hero.startingStats[stat] + statBonuses[stat] >= MAX_STAT_VALUE
                "
                @click="$emit('statUp', stat)"
              />
            </template>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  STAT_NAMES,
  FIXED_LEVEL_HEROES,
  MAX_LEVEL_UPS,
  MAX_STAT_VALUE
} from '~/types/hero';
import type { HeroId, HeroStats, StatName } from '~/types/hero';

const props = defineProps<{
  hero: {
    id: string;
    name: string;
    startingStats: HeroStats;
  };
  statBonuses: HeroStats;
  pointsRemaining: number;
}>();

defineEmits<{
  statUp: [stat: StatName];
  statDown: [stat: StatName];
}>();

const canLevelUp = computed(() => !(props.hero.id in FIXED_LEVEL_HEROES));

const heroLevel = computed(() => {
  const fixedLevel = FIXED_LEVEL_HEROES[props.hero.id as HeroId];
  if (fixedLevel !== undefined) return fixedLevel;
  return 1 + (MAX_LEVEL_UPS - props.pointsRemaining);
});
</script>
