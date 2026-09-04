<template>
  <div class="w-full max-w-92 bg-default panel">
    <div class="flex plate items-center justify-between gap-2 px-3">
      <h3 class="truncate font-heading text-title uppercase">
        {{ hero.name }}
      </h3>

      <div class="flex items-center gap-2">
        <div v-if="flightInfo" class="flex w-6 items-center justify-center">
          <TooltipButton
            v-if="flightShown"
            :text="
              flightInfo.name
                ? `${flightInfo.name}: ${flightInfo.description}`
                : flightInfo.description
            "
            icon="i-lucide-plane"
            :color="flightColor"
            :active="flightActive"
            :disabled="flightLocked"
            :confirmation="
              () =>
                confirmationText({
                  kind: 'flight',
                  name: flightInfo!.name,
                  trained: flightActive
                })
            "
            @click="toggleFlight(heroId)"
          />
        </div>

        <div v-if="canLevelUp" class="flex w-6 items-center justify-center">
          <IconButton
            v-if="
              levelUpPointsUsed > 0 ||
              hasPowers ||
              flightActive ||
              bonusLevel > 0
            "
            icon="i-lucide-rotate-ccw"
            color="neutral"
            @click="resetHero(heroId)"
          />
        </div>

        <span class="w-8 text-end text-xs text-muted select-none">
          Lv. {{ heroLevel }}
        </span>

        <div v-if="canLevelUp" class="flex w-6 items-center justify-center">
          <IconButton
            v-if="bonusLevel > 0 || !bonusFull"
            :icon="bonusLevel === 0 ? 'i-lucide-plus-circle' : undefined"
            :color="bonusLevel > 0 ? 'primary' : 'neutral'"
            :disabled="bonusLevel >= 4 || bonusFull"
            @click="addBonusLevel(heroId)"
          >
            <span v-if="bonusLevel > 0" class="text-xs font-semibold"
              >+{{ bonusLevel }}</span
            >
          </IconButton>
        </div>
      </div>
    </div>

    <!-- ! The tighter base gap is what leaves the shrunk portrait column wide enough for the power chips beneath it: at 320px the column lands on 80px and the chips need 78px. At `gap-3` it lands on 76px and they overflow. -->
    <div class="flex justify-between gap-2 p-3 sm:gap-3">
      <!-- ! Shrinkable, not fixed: at 27rem the portrait column plus the stat rows need 316px of a 260px row below ~328px viewport, and the portrait is the only part that degrades gracefully — the stat steppers are tap targets and must not shrink at the narrowest width. Nothing moves at 360px and up. -->
      <div class="flex w-27 min-w-0 shrink flex-col gap-2">
        <HeroPortrait
          :hero-id="heroId"
          usage="card"
          :alt="hero.name"
          class="aspect-square w-full cursor-pointer border-2 border-accented bg-accented object-cover transition-shadow select-none hover:ring-2 hover:ring-warning"
          @click="$emit('viewDetail')"
        />

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
                  @click="statDown(heroId, resolvedStat(stat))"
                />
              </div>

              <span class="w-5 text-center font-bold">{{
                hero.startingStats[resolvedStat(stat)] +
                statBonuses[resolvedStat(stat)] +
                specialPowerBonus[resolvedStat(stat)]
              }}</span>

              <div class="flex w-6 items-center justify-center">
                <IconButton
                  v-if="canLevelUp"
                  icon="i-lucide-plus"
                  color="neutral"
                  :disabled="
                    pointsRemaining <= 0 ||
                    hero.startingStats[resolvedStat(stat)] +
                      statBonuses[resolvedStat(stat)] >=
                      MAX_STAT_VALUE
                  "
                  @click="statUp(heroId, resolvedStat(stat))"
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
import HeroPortrait from '@/components/HeroPortrait.vue';
import HeroPowerChips from '@/components/HeroPowerChips.vue';

import { confirmationText } from '@/utils/confirmationText';
import { STAT_NAMES, MAX_STAT_VALUE } from '@/types/hero';

import type { HeroId, StatName } from '@/types/hero';

const props = defineProps<{
  heroId: HeroId;
}>();

defineEmits<{
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

// * The card is always given a hero that exists, so it narrows the shared value once here rather than guarding at every use. The dialog cannot: its hero is null while it is closed.
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

const flightColor = computed(() =>
  flightVisuallyActive.value
    ? 'primary'
    : flightActive.value
      ? 'secondary'
      : 'neutral'
);
</script>
