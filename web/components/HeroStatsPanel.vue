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
              @click="addBonusLevel(heroId)"
            />

            <IconButton
              icon="i-lucide-rotate-ccw"
              color="neutral"
              size="sm"
              :disabled="!canLevelUp"
              label="Reset this hero"
              @click="resetHero(heroId)"
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
                  @click="statDown(heroId, resolvedStat(stat))"
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
                  @click="statUp(heroId, resolvedStat(stat))"
                />
              </div>
            </div>
          </li>
        </ul>

        <Transition name="state-fade">
          <div v-if="synergyPartner" class="flex flex-col gap-3">
            <button
              type="button"
              class="flex items-center justify-center gap-2 border-2 border-default p-1.5 font-heading tracking-label text-toned uppercase hover:border-accented hover:text-highlighted"
              @click="emit('select', synergyPartner.id)"
            >
              <u-icon name="i-lucide-link" class="size-4 shrink-0" />
              <span>Synergy partner:</span>

              <!-- * Old and new names overlap in one grid cell so the label beside them stays put. -->
              <!-- ! The invisible longest name reserves the cell, or the row re-centres on every switch. -->
              <span class="grid">
                <span
                  class="invisible col-start-1 row-start-1"
                  aria-hidden="true"
                >
                  {{ longestPartnerName }}
                </span>

                <Transition name="state-fade">
                  <span
                    :key="synergyPartner.id"
                    class="col-start-1 row-start-1"
                  >
                    {{ synergyPartner.name }}
                  </span>
                </Transition>
              </span>
            </button>

            <div class="flex flex-col gap-1 bg-muted p-3">
              <p class="font-heading tracking-label text-toned uppercase">
                Pair total
              </p>

              <!-- ! Reserves the two-sentence Spread Thin variant, or Golem's pair alone pushes the fixed-height column into scroll. -->
              <div aria-label="Pair total description" class="grid">
                <p
                  v-for="variant in pairTotalDescriptionVariants"
                  :key="variant"
                  class="invisible col-start-1 row-start-1 text-sm text-muted"
                  aria-hidden="true"
                >
                  {{ variant }}
                </p>

                <p class="col-start-1 row-start-1 text-sm text-muted">
                  {{ pairTotalDescription }}
                </p>
              </div>
            </div>

            <!-- ! Read-only: this is the pair's total, and steppers here would silently change the partner. -->
            <ul class="flex flex-col gap-1 bg-muted px-3 pb-3">
              <li
                v-for="entry in shownCombinedStats"
                :key="entry.stat"
                class="flex items-center justify-between"
              >
                <span
                  class="flex items-center gap-2 font-heading text-lg tracking-label text-toned uppercase"
                >
                  <u-icon
                    :name="STAT_ICONS[entry.stat]"
                    class="size-5 shrink-0"
                  />
                  {{ entry.stat }}
                </span>

                <div class="ml-2 flex items-center gap-1">
                  <div class="w-7" />

                  <span class="w-7 text-center text-xl font-bold">
                    {{ entry.value }}
                  </span>

                  <div class="w-7" />
                </div>
              </li>
            </ul>
          </div>
        </Transition>
      </div>
    </ScrollRegion>
  </div>
</template>

<script setup lang="ts">
import {
  MAX_STAT_VALUE,
  SPECIAL_POWER_MECHANICS,
  STAT_NAMES
} from '@/types/hero';

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
  getEffectiveStats,
  getPairCombinedStats,
  getSpecialPowerState
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

// * The planner's shared pair computation, so this block and the synergy tab agree.
// ! Declared above the tween: `useTweenedValues` reads its source once at setup.
const pairTotals = computed<Partial<Record<StatName, number>>>(() => {
  const partner = synergyPartner.value;

  if (!partner) {
    return {};
  }

  return getPairCombinedStats(props.heroId, partner.id);
});

// ! One fixed-length array: `useTweenedValues` jumps when the length changes, so a hero without a partner holds zeros in the pair slots.
const LEVEL_INDEX = STAT_NAMES.length;
const BONUS_INDEX = LEVEL_INDEX + 1;
const PAIR_OFFSET = BONUS_INDEX + 1;

const figureTargets = computed(() => [
  ...STAT_NAMES.map((stat) => getEffectiveStats(props.heroId)[stat]),
  heroLevel.value,
  bonusLevel.value,
  ...STAT_NAMES.map((stat) => pairTotals.value[stat] ?? 0)
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

const shownCombinedStats = computed(() =>
  STAT_NAMES.map((stat, index) => ({
    stat,
    value: shownFigure(PAIR_OFFSET + index)
  }))
);

// * Only while Spread Thin is actually contributing to the pair.
const pairFillsASlot = computed(() =>
  [props.heroId, synergyPartner.value?.id].some(
    (id) =>
      !!id &&
      SPECIAL_POWER_MECHANICS[id as keyof typeof SPECIAL_POWER_MECHANICS]
        ?.type === 'spread-thin' &&
      getSpecialPowerState(id) > 0
  )
);

const pairTotalBaseText = computed(() =>
  synergyPartner.value
    ? `${hero.value?.name} and ${synergyPartner.value.name} combined, with every bonus applied.`
    : ''
);

const PAIR_TOTAL_SPREAD_THIN_SUFFIX =
  " Spread Thin counts the partner's slot as filled.";

// * Both variants, for the reserved-height cell.
const pairTotalDescriptionVariants = computed(() => [
  pairTotalBaseText.value,
  pairTotalBaseText.value + PAIR_TOTAL_SPREAD_THIN_SUFFIX
]);

const pairTotalDescription = computed(() =>
  pairFillsASlot.value
    ? pairTotalDescriptionVariants.value[1]
    : pairTotalDescriptionVariants.value[0]
);

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
