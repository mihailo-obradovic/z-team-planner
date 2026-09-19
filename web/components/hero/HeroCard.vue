<template>
  <div class="w-full max-w-92 bg-default panel">
    <div class="flex plate items-center justify-between gap-2 px-3">
      <h3 class="truncate font-heading text-title uppercase">
        {{ hero.name }}
      </h3>

      <div class="flex items-center gap-2">
        <!-- * The span is the transition's element because the button components render fragments; the reserved slot keeps the row still while an icon fades. -->
        <div v-if="flightInfo" class="flex w-6 items-center justify-center">
          <Transition name="state-fade">
            <span v-if="flightShown" class="flex">
              <TooltipButton
                :text="flightTooltip"
                icon="i-lucide-plane"
                :color="flightColor"
                :active="flightActive"
                :disabled="flightLocked"
                :confirmation="flightConfirmation"
                @click="handleToggleFlight"
              />
            </span>
          </Transition>
        </div>

        <div v-if="canLevelUp" class="flex w-6 items-center justify-center">
          <Transition name="state-fade">
            <span v-if="hasAnythingToReset" class="flex">
              <IconButton
                icon="i-lucide-rotate-ccw"
                color="neutral"
                label="Reset this hero"
                @click="handleReset"
              />
            </span>
          </Transition>
        </div>

        <span class="w-8 text-end text-xs text-muted select-none">
          Lv. {{ heroLevel }}
        </span>

        <div v-if="canLevelUp" class="flex w-6 items-center justify-center">
          <Transition name="state-fade">
            <span v-if="bonusLevel > 0 || !bonusFull" class="flex">
              <IconButton
                :icon="bonusLevel === 0 ? 'i-lucide-plus-circle' : undefined"
                :color="bonusLevel > 0 ? 'primary' : 'neutral'"
                :disabled="bonusLevel >= MAX_BONUS_LEVEL_PER_HERO || bonusFull"
                :swap-key="bonusLevel"
                label="Add a bonus level"
                @click="handleAddBonusLevel"
              >
                <span v-if="bonusLevel > 0" class="text-xs font-semibold"
                  >+{{ bonusLevel }}</span
                >
              </IconButton>
            </span>
          </Transition>
        </div>
      </div>
    </div>

    <!-- ! The tighter base gap leaves the portrait column the 78px the power chips need at 320px; `gap-3` overflows them. -->
    <div class="flex justify-between gap-2 p-3 sm:gap-3">
      <!-- ! Shrinkable because the portrait is the only part that degrades gracefully below ~328px; the stat steppers are tap targets and must not shrink. -->
      <div class="flex w-27 min-w-0 shrink flex-col gap-2">
        <button
          type="button"
          class="block w-full cursor-pointer"
          :aria-label="`View ${hero.name}`"
          @click="handleViewDetail"
        >
          <HeroPortrait
            :hero-id="heroId"
            usage="card"
            :alt="hero.name"
            class="aspect-square w-full border-2 border-accented bg-accented object-cover transition-shadow select-none hover:ring-2 hover:ring-warning"
          />
        </button>

        <HeroPowerChips :hero-id="heroId" />
      </div>

      <div class="flex flex-1 flex-col">
        <ul class="flex flex-1 flex-col justify-between text-sm">
          <li
            v-for="stat in STAT_NAMES"
            :key="stat"
            class="flex items-center justify-between select-none"
          >
            <span
              class="flex items-center gap-2 font-heading tracking-label text-toned uppercase"
            >
              <u-icon :name="STAT_ICONS[stat]" class="size-4 shrink-0" />
              {{ stat }}
            </span>

            <div class="ml-2 flex items-center gap-1">
              <div class="flex w-6 items-center justify-center">
                <IconButton
                  v-if="canLevelUp"
                  icon="i-lucide-minus"
                  color="neutral"
                  :disabled="statBonuses[resolvedStat(stat)] <= 0"
                  :label="`Remove a ${stat} point`"
                  @click="() => handleStatDown(stat)"
                />
              </div>

              <span class="w-5 text-center font-bold">
                {{ shownStat(stat) }}
              </span>

              <div class="flex w-6 items-center justify-center">
                <IconButton
                  v-if="canLevelUp"
                  icon="i-lucide-plus"
                  color="neutral"
                  :disabled="isStatCapped(stat)"
                  :label="`Add a ${stat} point`"
                  @click="() => handleStatUp(stat)"
                />
              </div>
            </div>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import HeroPortrait from '@/components/hero/HeroPortrait.vue';
import HeroPowerChips from '@/components/hero/HeroPowerChips.vue';

import {
  STAT_NAMES,
  MAX_BONUS_LEVEL_PER_HERO,
  MAX_STAT_VALUE
} from '@/types/hero';

import type { HeroId, StatName } from '@/types/hero';

const props = defineProps<{
  heroId: HeroId;
}>();

const emit = defineEmits<{
  viewDetail: [];
}>();

const {
  statUp,
  statDown,
  addBonusLevel,
  getSpecialPowerBonusStats,
  monsterForm,
  toggleFlight,
  resetHero
} = useHeroPlanner();

const {
  hero: maybeHero,
  statBonuses,
  levelUpPointsUsed,
  bonusLevel,
  pointsRemaining,
  bonusFull,
  canLevelUp,
  heroLevel,
  flightActive,
  flightInfo,
  flightShown,
  flightLocked,
  hasPowers,
  resolvedStat
} = useHeroDerived(() => props.heroId);

// * The card always gets an existing hero, so it narrows once here; the dialog can't, as its hero is null while closed.
const hero = computed(() => maybeHero.value!);

const specialPowerBonus = computed(() =>
  getSpecialPowerBonusStats(props.heroId)
);

const flightVisuallyActive = computed(() => {
  if (props.heroId !== 'sonar') {
    return flightActive.value;
  }

  return flightActive.value && monsterForm.value;
});

const flightTooltip = computed(() => {
  const flight = flightInfo.value;

  if (!flight) {
    return '';
  }

  return flight.name
    ? `${flight.name}: ${flight.description}`
    : flight.description;
});

function flightConfirmation(): string | null {
  return confirmationText({
    kind: 'flight',
    name: flightInfo.value?.name ?? null,
    trained: flightActive.value
  });
}

const hasAnythingToReset = computed(
  () =>
    levelUpPointsUsed.value > 0 ||
    hasPowers.value ||
    flightActive.value ||
    bonusLevel.value > 0
);

function shownStat(stat: StatName): number {
  const resolved = resolvedStat(stat);

  return (
    hero.value.startingStats[resolved] +
    statBonuses.value[resolved] +
    specialPowerBonus.value[resolved]
  );
}

function isStatCapped(stat: StatName): boolean {
  const resolved = resolvedStat(stat);

  return (
    pointsRemaining.value <= 0 ||
    hero.value.startingStats[resolved] + statBonuses.value[resolved] >=
      MAX_STAT_VALUE
  );
}

const flightColor = computed(() =>
  flightVisuallyActive.value
    ? 'primary'
    : flightActive.value
      ? 'secondary'
      : 'neutral'
);

function handleToggleFlight() {
  toggleFlight(props.heroId);
}

function handleReset() {
  resetHero(props.heroId);
}

function handleAddBonusLevel() {
  addBonusLevel(props.heroId);
}

function handleViewDetail() {
  emit('viewDetail');
}

function handleStatDown(stat: StatName) {
  statDown(props.heroId, resolvedStat(stat));
}

function handleStatUp(stat: StatName) {
  statUp(props.heroId, resolvedStat(stat));
}
</script>
