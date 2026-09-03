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
            :text="`${flightInfo.name}: ${flightInfo.description}`"
            icon="i-lucide-plane"
            :color="flightColor"
            :active="flightActive"
            :disabled="flightLocked"
            @click="toggleFlight(heroId)"
          />
        </div>

        <div v-if="canLevelUp" class="flex w-6 items-center justify-center">
          <IconButton
            v-if="
              getLevelUpPointsUsedValue > 0 ||
              hasPowers ||
              flightActive ||
              bonusLevel > 0
            "
            icon="i-lucide-rotate-ccw"
            color="neutral"
            @click="resetHero(heroId)"
          />
        </div>

        <span class="w-8 text-end text-xs text-muted">Lv. {{ heroLevel }}</span>

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
        <NuxtImg
          :src="portraitSrc"
          :alt="hero.name"
          class="aspect-square w-full cursor-pointer border-2 border-accented bg-accented object-cover transition-shadow hover:ring-2 hover:ring-warning"
          @click="$emit('viewDetail')"
        />

        <HeroPowerChips :hero-id="heroId" />
      </div>

      <div class="flex flex-1 flex-col">
        <ul class="flex flex-1 flex-col justify-between text-sm">
          <li
            v-for="stat in STAT_NAMES"
            :key="stat"
            class="flex items-center justify-between"
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
import HeroPowerChips from '@/components/HeroPowerChips.vue';

import {
  STAT_NAMES,
  FIXED_LEVEL_HEROES,
  MAX_LEVEL_UPS,
  MAX_STAT_VALUE,
  MAX_FLIGHT_TRAININGS,
  MAX_BONUS_POINTS,
  HERO_FLIGHT,
  HERO_FLIGHT_CAPABILITY
} from '@/types/hero';

import type { HeroId, StatName } from '@/types/hero';

const props = defineProps<{
  heroId: HeroId;
}>();

defineEmits<{
  viewDetail: [];
}>();

const {
  heroes,
  getStatAllocations,
  getLevelUpPointsUsed,
  statUp,
  statDown,
  getBonusLevel,
  addBonusLevel,
  bonusLevelsUsed,
  getPowerState,
  getSpecialPowerBonusStats,
  monsterForm,
  resolveDisplayStat,
  flyingHeroIds,
  toggleFlight,
  flightTrainingsUsed,
  resetHero
} = useHeroPlanner();

const hero = computed(() =>
  (heroes.value ?? []).find((h) => h.id === props.heroId)!
);

const statBonuses = computed(() => getStatAllocations(props.heroId));

const specialPowerBonus = computed(() =>
  getSpecialPowerBonusStats(props.heroId)
);

const pointsRemaining = computed(
  () =>
    MAX_LEVEL_UPS +
    getBonusLevel(props.heroId) -
    getLevelUpPointsUsed(props.heroId)
);

const flightActive = computed(() => flyingHeroIds.value.has(props.heroId));

const bonusLevel = computed(() => getBonusLevel(props.heroId));

const flightsFull = computed(
  () => flightTrainingsUsed.value >= MAX_FLIGHT_TRAININGS
);

const bonusFull = computed(() => bonusLevelsUsed.value >= MAX_BONUS_POINTS);

const flightInfo = computed(
  () => HERO_FLIGHT[props.heroId as keyof typeof HERO_FLIGHT]
);

// * Phenomaman on Heavily Medicated does not have a disabled flight — he has no flight. Every other flier's glyph is a state the card can show as off.
const flightShown = computed(() => {
  const capability =
    HERO_FLIGHT_CAPABILITY[props.heroId as keyof typeof HERO_FLIGHT_CAPABILITY];

  if (capability?.type !== 'conditional-power') {
    return true;
  }

  return flightActive.value;
});

const flightLocked = computed(() => {
  if (props.heroId === 'blonde-blazer' || props.heroId === 'phenomaman') {
    return true;
  }
  return !flightActive.value && flightsFull.value;
});

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

const portraitSrc = computed(() =>
  heroPortraitSrc(props.heroId, monsterForm.value ? 'monster' : 'hybrid')
);

const canLevelUp = computed(() => !(props.heroId in FIXED_LEVEL_HEROES));

const heroLevel = computed(() => {
  const fixedLevel =
    FIXED_LEVEL_HEROES[props.heroId as keyof typeof FIXED_LEVEL_HEROES];
  if (fixedLevel !== undefined) {
    return fixedLevel;
  }
  // * A bonus level raises the per-hero cap; it does not itself raise the level. Counting it here made the level jump the moment the bonus was granted, before the extra point was spent — and disagreed with the detail dialog.
  return 1 + getLevelUpPointsUsedValue.value;
});

const getLevelUpPointsUsedValue = computed(() =>
  getLevelUpPointsUsed(props.heroId)
);

const hasPowers = computed(() => {
  const powerState = getPowerState(props.heroId);

  return powerState.startingRevealed || powerState.trainableSelected > 0;
});

function resolvedStat(stat: StatName): StatName {
  return resolveDisplayStat(props.heroId, stat);
}
</script>
