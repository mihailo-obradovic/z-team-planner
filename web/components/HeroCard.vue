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
            </span>
          </Transition>
        </div>

        <div v-if="canLevelUp" class="flex w-6 items-center justify-center">
          <Transition name="state-fade">
            <span
              v-if="
                levelUpPointsUsed > 0 ||
                hasPowers ||
                flightActive ||
                bonusLevel > 0
              "
              class="flex"
            >
              <IconButton
                icon="i-lucide-rotate-ccw"
                color="neutral"
                @click="resetHero(heroId)"
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
                @click="addBonusLevel(heroId)"
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
import {
  STAT_NAMES,
  MAX_BONUS_LEVEL_PER_HERO,
  MAX_STAT_VALUE
} from '@/types/hero';

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

const flightColor = computed(() =>
  flightVisuallyActive.value
    ? 'primary'
    : flightActive.value
      ? 'secondary'
      : 'neutral'
);
</script>
