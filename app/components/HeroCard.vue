<template>
  <div class="rounded-lg border border-default bg-elevated p-4">
    <NuxtImg
      :src="`/portraits/${hero.id}.webp`"
      :alt="hero.name"
      class="aspect-square w-full rounded-md bg-accented mb-3 object-cover"
    />

    <h3 class="text-lg font-semibold mb-2">{{ hero.name }}</h3>

    <ul class="space-y-1 text-sm">
      <li v-for="stat in STAT_NAMES" :key="stat" class="flex justify-between">
        <span class="capitalize text-muted">{{ stat }}</span>
        <span class="font-medium">{{ hero.startingStats[stat] }}</span>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { STAT_NAMES } from '~/types/hero';
import type { HeroStats } from '~/types/hero';

defineProps<{
  hero: {
    id: string;
    name: string;
    startingStats: HeroStats;
  };
}>();
</script>
