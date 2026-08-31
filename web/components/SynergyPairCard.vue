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
      <!-- * Below lg this row holds portraits + stats; below sm they spread apart across the full-width card. The stacking is not left to natural flex wrapping — the same @container query that caps the radar frame forces it, so the two can never disagree. -->
      <div
        class="flex flex-wrap items-center gap-4 max-sm:justify-between lg:contents"
      >
        <div
          class="@max-[31rem]:basis-full @max-[31rem]:justify-center flex shrink-0 gap-3"
        >
          <SynergyHeroPortrait
            :hero-id="top.id"
            @viewDetail="$emit('viewDetail', top.id)"
          />

          <SynergyHeroPortrait
            :hero-id="bottom.id"
            @viewDetail="$emit('viewDetail', bottom.id)"
          />
        </div>

        <!-- * Below lg the type steps down so five rows land near the portrait column's height (portrait 108 + gap + chip row). -->
        <ul
          class="@max-[31rem]:mx-auto flex min-w-40 flex-1 flex-col gap-1 max-md:w-56 max-md:flex-none lg:gap-2"
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

            <!-- * A fixed slot: the total grows to two digits without shifting the column, so every card keeps the same width (layout protection). -->
            <span class="w-7 text-center text-base font-bold lg:text-xl">
              {{ entry.value }}
            </span>
          </li>
        </ul>
      </div>

      <!-- * One query drives the whole stacked state: below 31rem of the tab container's content box (= the card; portraits 228 + gap 16 + stats 224 + card padding 24 = 492, plus a 4px margin against subpixel wrapping) the portraits stack, the stats center, and this frame caps — all together. -->
      <div
        class="@max-[31rem]:max-w-56 @max-[31rem]:self-center w-full border-2 border-accented bg-default lg:w-56 lg:shrink-0"
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
