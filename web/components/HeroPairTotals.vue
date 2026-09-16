<template>
  <div class="flex flex-col gap-3">
    <button
      type="button"
      class="flex items-center justify-center gap-2 border-2 border-default p-1.5 font-heading tracking-label text-toned uppercase hover:border-accented hover:text-highlighted"
      @click="emit('select', partner.id)"
    >
      <u-icon name="i-lucide-link" class="size-4 shrink-0" />
      <span>Synergy partner:</span>

      <!-- * Old and new names overlap in one grid cell so the label beside them stays put. -->
      <!-- ! The invisible longest name reserves the cell, or the row re-centres on every switch. -->
      <span class="grid">
        <span class="invisible col-start-1 row-start-1" aria-hidden="true">
          {{ longestPartnerName }}
        </span>

        <Transition name="state-fade">
          <span :key="partner.id" class="col-start-1 row-start-1">
            {{ partner.name }}
          </span>
        </Transition>
      </span>
    </button>

    <div class="flex flex-col gap-1 bg-muted p-3">
      <p class="font-heading tracking-label text-toned uppercase">Pair total</p>

      <!-- ! Reserves the two-sentence Spread Thin variant, or Golem's pair alone pushes the fixed-height column into scroll. -->
      <div aria-label="Pair total description" class="grid">
        <p
          v-for="variant in descriptionVariants"
          :key="variant"
          class="invisible col-start-1 row-start-1 text-sm text-muted"
          aria-hidden="true"
        >
          {{ variant }}
        </p>

        <p class="col-start-1 row-start-1 text-sm text-muted">
          {{ description }}
        </p>
      </div>
    </div>

    <!-- ! Read-only: this is the pair's total, and steppers here would silently change the partner. -->
    <ul class="flex flex-col gap-1 bg-muted px-3 pb-3">
      <li
        v-for="entry in shownStats"
        :key="entry.stat"
        class="flex items-center justify-between"
      >
        <span
          class="flex items-center gap-2 font-heading text-lg tracking-label text-toned uppercase"
        >
          <u-icon :name="STAT_ICONS[entry.stat]" class="size-5 shrink-0" />
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
</template>

<script setup lang="ts">
import { SPECIAL_POWER_MECHANICS, STAT_NAMES } from '@/types/hero';

import type { Hero, HeroId } from '@/types/hero';

const props = defineProps<{
  heroId: HeroId;
  partner: Hero;
  longestPartnerName: string;
}>();

const emit = defineEmits<{
  select: [heroId: HeroId];
}>();

const { getPairCombinedStats, getSpecialPowerState } = useHeroPlanner();

const { hero } = useHeroDerived(() => props.heroId);

// * The planner's shared pair computation, so this block and the synergy tab agree.
const pairTotals = computed(() =>
  getPairCombinedStats(props.heroId, props.partner.id)
);

const figures = useTweenedValues(() =>
  STAT_NAMES.map((stat) => pairTotals.value[stat] ?? 0)
);

// * Rounded from the tween, so the figures count to their new values.
const shownStats = computed(() =>
  STAT_NAMES.map((stat, index) => ({
    stat,
    value: Math.round(figures.value[index] ?? 0)
  }))
);

// * Only while Spread Thin is actually contributing to the pair.
const fillsASlot = computed(() =>
  [props.heroId, props.partner.id].some(
    (id) =>
      SPECIAL_POWER_MECHANICS[id as keyof typeof SPECIAL_POWER_MECHANICS]
        ?.type === 'spread-thin' && getSpecialPowerState(id) > 0
  )
);

const baseText = computed(
  () =>
    `${hero.value?.name} and ${props.partner.name} combined, with every bonus applied.`
);

const SPREAD_THIN_SUFFIX = " Spread Thin counts the partner's slot as filled.";

// * Both variants, for the reserved-height cell.
const descriptionVariants = computed(() => [
  baseText.value,
  baseText.value + SPREAD_THIN_SUFFIX
]);

const description = computed(() =>
  fillsASlot.value ? descriptionVariants.value[1] : descriptionVariants.value[0]
);
</script>
