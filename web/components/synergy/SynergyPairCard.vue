<template>
  <!-- * `w-fit` cannot be its own query container, so every `@` variant here reads the tab wrapper (feature 014, annex §14.3). Below 31rem `fit-content` already clamps the card to it. -->
  <div class="w-fit bg-default panel">
    <div
      class="flex plate items-center justify-between gap-6 px-3 @max-[58rem]:justify-center"
    >
      <h3 class="flex items-center gap-2 font-heading text-title uppercase">
        {{ top.name }}

        <u-icon name="i-lucide-link" class="size-5 shrink-0" />

        {{ bottom.name }}
      </h3>
    </div>

    <!-- * 58rem = the row form's measured 923px: two 224 portraits and their gap, the stat list at its 160 floor, the 224 radar, two gap-6, padding and border. -->
    <div
      class="flex flex-col gap-4 p-3 @min-[58rem]:flex-row @min-[58rem]:items-center @min-[58rem]:gap-6"
    >
      <!-- * The stacking comes from the same @container query that caps the radar frame, not flex wrapping, so the two never disagree. -->
      <div class="flex flex-wrap items-center gap-4 @min-[58rem]:contents">
        <div
          class="flex shrink-0 gap-3 @max-[31rem]:basis-full @max-[31rem]:justify-center"
        >
          <SynergyHeroPortrait
            :hero-id="top.id"
            @view-detail="handleViewTopDetail"
          />

          <SynergyHeroPortrait
            :hero-id="bottom.id"
            @view-detail="handleViewBottomDetail"
          />
        </div>

        <!-- * Below 58rem the type steps down so five rows match the portrait column's height. -->
        <ul
          class="flex w-56 flex-none flex-col gap-1 @max-[31rem]:mx-auto @min-[58rem]:w-auto @min-[58rem]:min-w-40 @min-[58rem]:flex-1 @min-[58rem]:gap-2"
        >
          <li
            v-for="entry in combinedStats"
            :key="entry.stat"
            class="flex items-center justify-between gap-6"
          >
            <span
              class="flex items-center gap-2 font-heading text-sm tracking-label text-toned uppercase @min-[58rem]:text-lg"
            >
              <u-icon
                :name="STAT_ICONS[entry.stat]"
                class="size-4 shrink-0 @min-[58rem]:size-5"
              />
              {{ entry.stat }}
            </span>

            <!-- * Fixed width, so a two-digit total doesn't shift the column. -->
            <span
              class="w-7 text-center text-base font-bold @min-[58rem]:text-xl"
            >
              {{ entry.value }}
            </span>
          </li>
        </ul>
      </div>

      <!-- * 31rem = portraits 228 + gap 16 + stats 224 + padding 24, plus 4px against subpixel wrapping. -->
      <div
        class="w-full border-2 border-accented bg-default @max-[31rem]:max-w-56 @max-[31rem]:self-center @min-[58rem]:w-56 @min-[58rem]:shrink-0"
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
