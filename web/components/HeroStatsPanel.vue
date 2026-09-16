<template>
  <div class="flex min-w-0 flex-col border-2 border-accented bg-default">
    <!-- ! Comments stay inside the root, so the grid placement the dialog passes falls through. -->
    <!-- ! A static shell and an inner scroll box, as in HeroPowersPanel. -->
    <ScrollRegion
      class="flex flex-col p-3 md:min-h-0 md:flex-1 lg:min-h-0 lg:flex-1"
    >
      <!-- * No `:key`: the DOM persists across heroes, so the figures count to their new values. -->
      <div class="flex flex-col gap-3">
        <div class="flex items-center gap-4 border-b-2 border-default pb-3">
          <span class="font-heading tracking-label text-toned uppercase">
            Level
            <span class="text-lg font-bold text-highlighted select-none">
              {{ shownLevel }}
            </span>
          </span>

          <span class="font-heading tracking-label text-toned uppercase">
            Bonus
            <span class="text-lg font-bold text-highlighted select-none">
              {{ shownBonus }}
            </span>
          </span>

          <div class="ml-auto flex items-center gap-2">
            <IconButton
              icon="i-lucide-plus"
              color="neutral"
              size="sm"
              :disabled="bonusFull || !canLevelUp"
              label="Add a bonus level"
              @click="handleAddBonusLevel"
            />

            <IconButton
              icon="i-lucide-rotate-ccw"
              color="neutral"
              size="sm"
              :disabled="!canLevelUp"
              label="Reset this hero"
              @click="handleReset"
            />
          </div>
        </div>

        <!-- * Folds the special-power bonus into the number exactly as the hero card does. -->
        <ul class="flex flex-col gap-1 px-3">
          <li
            v-for="stat in STAT_NAMES"
            :key="stat"
            class="flex items-center justify-between"
          >
            <span
              class="flex items-center gap-2 font-heading text-lg tracking-label text-toned uppercase"
            >
              <u-icon :name="STAT_ICONS[stat]" class="size-5 shrink-0" />
              {{ stat }}
            </span>

            <div class="ml-2 flex items-center gap-1">
              <div class="flex w-7 items-center justify-center">
                <IconButton
                  v-if="canLevelUp"
                  icon="i-lucide-minus"
                  color="neutral"
                  size="sm"
                  :disabled="statBonuses[resolvedStat(stat)] <= 0"
                  :label="`Remove a ${stat} point`"
                  @click="() => handleStatDown(stat)"
                />
              </div>

              <span class="w-7 text-center text-xl font-bold">
                {{ shownStat(stat) }}
              </span>

              <div class="flex w-7 items-center justify-center">
                <IconButton
                  v-if="canLevelUp"
                  icon="i-lucide-plus"
                  color="neutral"
                  size="sm"
                  :disabled="isStatCapped(stat)"
                  :label="`Add a ${stat} point`"
                  @click="() => handleStatUp(stat)"
                />
              </div>
            </div>
          </li>
        </ul>

        <Transition name="state-fade">
          <HeroPairTotals
            v-if="synergyPartner"
            :hero-id="heroId"
            :partner="synergyPartner"
            :longest-partner-name="longestPartnerName"
            @select="handleSelect"
          />
        </Transition>
      </div>
    </ScrollRegion>
  </div>
</template>

<script setup lang="ts">
import HeroPairTotals from '@/components/HeroPairTotals.vue';

import { MAX_STAT_VALUE, STAT_NAMES } from '@/types/hero';

import type { HeroId, StatName } from '@/types/hero';

const props = defineProps<{
  heroId: HeroId;
  longestPartnerName: string;
}>();

const emit = defineEmits<{
  select: [heroId: HeroId];
}>();

const {
  synergyPairColumns,
  statUp,
  statDown,
  addBonusLevel,
  resetHero,
  getEffectiveStats
} = useHeroPlanner();

const {
  hero,
  statBonuses,
  bonusLevel,
  pointsRemaining,
  bonusFull,
  canLevelUp,
  heroLevel,
  resolvedStat
} = useHeroDerived(() => props.heroId);

const synergyPartner = computed(() => {
  for (const column of synergyPairColumns.value) {
    if (column.top.id === props.heroId) {
      return column.bottom;
    }

    if (column.bottom.id === props.heroId) {
      return column.top;
    }
  }

  return null;
});

const LEVEL_INDEX = STAT_NAMES.length;
const BONUS_INDEX = LEVEL_INDEX + 1;

const figureTargets = computed(() => [
  ...STAT_NAMES.map((stat) => getEffectiveStats(props.heroId)[stat]),
  heroLevel.value,
  bonusLevel.value
]);

const figures = useTweenedValues(figureTargets);

// * Anything deciding state reads the settled value, so it can't flicker mid-count.
function shownFigure(index: number): number {
  return Math.round(figures.value[index] ?? 0);
}

function shownStat(stat: StatName): number {
  return shownFigure(STAT_NAMES.indexOf(stat));
}

const shownLevel = computed(() => shownFigure(LEVEL_INDEX));
const shownBonus = computed(() => shownFigure(BONUS_INDEX));

function handleAddBonusLevel() {
  addBonusLevel(props.heroId);
}

function handleReset() {
  resetHero(props.heroId);
}

function handleStatDown(stat: StatName) {
  statDown(props.heroId, resolvedStat(stat));
}

function handleStatUp(stat: StatName) {
  statUp(props.heroId, resolvedStat(stat));
}

function handleSelect(heroId: HeroId) {
  emit('select', heroId);
}

// * The cap reads the raw allocation: a special-power bonus can show 10 while the allocation still has room.
function isStatCapped(stat: StatName): boolean {
  if (!hero.value) {
    return true;
  }

  const resolved = resolvedStat(stat);

  return (
    pointsRemaining.value <= 0 ||
    hero.value.startingStats[resolved] + statBonuses.value[resolved] >=
      MAX_STAT_VALUE
  );
}
</script>
