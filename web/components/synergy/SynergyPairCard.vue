<template>
  <div class="w-fit bg-default panel max-sm:w-full">
    <div
      class="flex plate items-center justify-between gap-6 px-3 max-md:justify-center"
    >
      <h3 class="flex items-center gap-2 font-heading text-title uppercase">
        {{ top.name }}

        <u-icon name="i-lucide-link" class="size-5 shrink-0" />

        {{ bottom.name }}
      </h3>
    </div>

    <div class="flex flex-col gap-4 p-3 lg:flex-row lg:items-center lg:gap-6">
      <!-- * The stacking comes from the same @container query that caps the radar frame, not flex wrapping, so the two never disagree. -->
      <div
        class="flex flex-wrap items-center gap-4 max-sm:justify-between lg:contents"
      >
        <div
          class="flex shrink-0 gap-3 @max-[31rem]:basis-full @max-[31rem]:justify-center"
        >
          <SynergyHeroPortrait
            :hero-id="top.id"
            @viewDetail="handleViewTopDetail"
          />

          <SynergyHeroPortrait
            :hero-id="bottom.id"
            @viewDetail="handleViewBottomDetail"
          />
        </div>

        <!-- * Below lg the type steps down so five rows match the portrait column's height. -->
        <ul
          class="flex min-w-40 flex-1 flex-col gap-1 max-md:w-56 max-md:flex-none lg:gap-2 @max-[31rem]:mx-auto"
        >
          <li
            v-for="entry in combinedStats"
            :key="entry.stat"
            class="flex items-center justify-between gap-6"
          >
            <span
              class="flex items-center gap-2 font-heading text-sm tracking-label text-toned uppercase lg:text-lg"
            >
              <u-icon
                :name="STAT_ICONS[entry.stat]"
                class="size-4 shrink-0 lg:size-5"
              />
              {{ entry.stat }}
            </span>

            <!-- * Fixed width, so a two-digit total doesn't shift the column. -->
            <span class="w-7 text-center text-base font-bold lg:text-xl">
              {{ entry.value }}
            </span>
          </li>
        </ul>
      </div>

      <!-- * 31rem = portraits 228 + gap 16 + stats 224 + padding 24, plus 4px against subpixel wrapping. -->
      <div
        class="w-full border-2 border-accented bg-default lg:w-56 lg:shrink-0 @max-[31rem]:max-w-56 @max-[31rem]:self-center"
      >
        <div class="mx-auto aspect-square w-full max-w-56">
          <StatRadar
            :axes="radarAxes"
            :title="`${top.name} and ${bottom.name} pair stats`"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import SynergyHeroPortrait from '@/components/synergy/SynergyHeroPortrait.vue';

import { STAT_NAMES } from '@/types/hero';

import type { Hero, HeroId } from '@/types/hero';

const props = defineProps<{
  top: Hero;
  bottom: Hero;
}>();

const emit = defineEmits<{
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

function handleViewTopDetail() {
  emit('viewDetail', props.top.id);
}

function handleViewBottomDetail() {
  emit('viewDetail', props.bottom.id);
}
</script>
