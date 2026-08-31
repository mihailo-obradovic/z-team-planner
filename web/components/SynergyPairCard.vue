<template>
  <div class="w-fit bg-default panel">
    <div class="flex plate items-center justify-between gap-6 px-3">
      <h3 class="flex items-center gap-2 font-heading text-title uppercase">
        {{ top.name }}

        <u-icon name="i-lucide-link" class="size-5 shrink-0" />

        {{ bottom.name }}
      </h3>

      <u-badge color="warning" variant="outline" icon="i-lucide-link-2">
        Synergy
      </u-badge>
    </div>

    <div class="flex items-center gap-6 p-3">
      <div class="flex shrink-0 gap-3">
        <SynergyHeroPortrait
          :hero-id="top.id"
          @viewDetail="$emit('viewDetail', top.id)"
        />

        <SynergyHeroPortrait
          :hero-id="bottom.id"
          @viewDetail="$emit('viewDetail', bottom.id)"
        />
      </div>

      <ul class="flex flex-col gap-2">
        <li
          v-for="entry in combinedStats"
          :key="entry.stat"
          class="flex items-center justify-between gap-6"
        >
          <span
            class="flex items-center gap-2 font-heading text-lg tracking-label text-toned uppercase"
          >
            <u-icon :name="STAT_ICONS[entry.stat]" class="size-5 shrink-0" />
            {{ entry.stat }}
          </span>

          <!-- * A fixed slot: the total grows to two digits without shifting the column, so every card keeps the same width (layout protection). -->
          <span class="w-7 text-center text-xl font-bold">
            {{ entry.value }}
          </span>
        </li>
      </ul>

      <div
        class="aspect-square w-56 shrink-0 border-2 border-accented bg-default"
      >
        <StatRadar
          :axes="radarAxes"
          :title="`${top.name} and ${bottom.name} pair stats`"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import SynergyHeroPortrait from '@/components/SynergyHeroPortrait.vue';

import { STAT_NAMES } from '@/types/hero';

import type { Hero, HeroId } from '@/types/hero';

const props = defineProps<{
  top: Hero;
  bottom: Hero;
}>();

defineEmits<{
  viewDetail: [heroId: HeroId];
}>();

const { getPairCombinedStats } = useHeroPlanner();

const pairTotals = computed(() =>
  getPairCombinedStats(props.top.id, props.bottom.id)
);

const combinedStats = computed(() =>
  STAT_NAMES.map((stat) => ({ stat, value: pairTotals.value[stat] }))
);

const radarAxes = computed(() =>
  RADAR_STAT_ORDER.map((stat) => ({
    key: stat,
    label: stat,
    icon: STAT_ICONS[stat],
    value: pairTotals.value[stat]
  }))
);

</script>
