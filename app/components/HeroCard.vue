<template>
  <!-- * w-full with a max, not a fixed w-92: 368px clips at the 320px reflow floor (annex §14.3). -->
  <div class="w-full max-w-92 bg-default panel">
    <div class="flex plate items-center justify-between gap-2 px-3">
      <h3 class="truncate font-heading text-title uppercase">
        {{ hero.name }}
      </h3>

      <div class="flex items-center gap-2">
        <!-- * Flight School is its own training track with its own budget (context/game-mechanics.md, Flight School), and it was the fifth chip that pushed the power strip past the portrait's width. It sits with the other per-hero glyphs instead, and reserves its slot only for the five heroes in HERO_FLIGHT — the same rule the reset and bonus wrappers follow. -->
        <div v-if="flightInfo" class="flex w-6 items-center justify-center">
          <TooltipButton
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

    <div class="flex justify-between gap-3 p-3">
      <!-- * The portrait column is pinned to the portrait's own 108px (annex §13). Left auto-width, the strip sized the column instead of the image, and the difference came out of the stat list — so Flambae and Coupé's stat rows stopped lining up with everyone else's. -->
      <div class="flex w-27 shrink-0 flex-col gap-2">
        <NuxtImg
          :src="portraitSrc"
          :alt="hero.name"
          class="aspect-square size-27 cursor-pointer border-2 border-accented bg-accented object-cover transition-shadow hover:ring-2 hover:ring-warning"
          @click="$emit('viewDetail')"
        />
        <!-- * Hero Power Training only, now that flight sits in the header: a fixed one-row box, never wrapping. Four 24px chips and three 4px gaps is 108, which is why the portrait is 108 and not the 112 it started at — a full row lines up with the image edge to edge, and a shorter one still centres under it. The box is sized for four; a hero gaining a fifth chip breaks it (feature 003, Business Rules). -->
        <div v-if="powers" class="flex h-6 items-center justify-center gap-1">
          <TooltipButton
            v-if="heroId === 'sonar'"
            :text="sonarFormTooltip"
            :icon="sonarFormIcon"
            :color="monsterForm ? 'primary' : 'neutral'"
            :active="monsterForm"
            @click="monsterForm = !monsterForm"
          />

          <TooltipButton
            :text="`${powers[0]!.name}: ${powers[0]!.description}`"
            :icon="POWER_ICONS[0]"
            :color="powerStates.startingRevealed ? 'primary' : 'neutral'"
            :active="powerStates.startingRevealed"
            @click="toggleStartingPower(heroId)"
          />

          <TooltipButton
            v-for="(power, i) in upgradePowers"
            :key="i"
            :text="`${power.name}: ${power.description}`"
            :icon="POWER_ICONS[i + 1]!"
            :color="trainablePowerColor(i)"
            :active="trainablePowerActive(i)"
            :disabled="isTrainableDisabled(i)"
            @click="toggleTrainablePower(heroId, (i + 1) as 1 | 2)"
          />

          <TooltipButton
            v-if="showFlambaeSupernova"
            text="Supernova: Set Combat and Mobility to 10"
            icon="i-lucide-flame"
            :color="specialPowerState ? 'primary' : 'neutral'"
            :active="specialPowerState > 0"
            @click="toggleSpecialPower(heroId)"
          />

          <TooltipButton
            v-if="showCoupeEnPointe"
            :text="coupeTooltip"
            :icon="coupeIcon"
            :color="specialPowerState ? 'primary' : 'neutral'"
            :active="specialPowerState > 0"
            @click="toggleSpecialPower(heroId)"
          />
        </div>
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
            <!-- * The stepper slots are reserved, not conditional: a fixed-level recruit renders no buttons, and without the wrappers its stat column measures 116 against everyone else's 172 — a narrower card in the same roster. Same rule as the header cluster's w-6 slots. -->
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
              <span class="w-5 text-center font-medium">{{
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
import {
  STAT_NAMES,
  FIXED_LEVEL_HEROES,
  MAX_LEVEL_UPS,
  MAX_STAT_VALUE,
  MAX_POWER_TRAININGS,
  MAX_FLIGHT_TRAININGS,
  MAX_BONUS_POINTS,
  HERO_POWERS,
  HERO_FLIGHT
} from '@/types/hero';
import type { HeroId, HeroPowerDefinition, StatName } from '@/types/hero';

const POWER_ICONS = [
  'i-lucide-zap',
  'i-lucide-shield',
  'i-lucide-swords'
] as const;

const MONSTER_FORM_SWAPS: Partial<Record<StatName, StatName>> = {
  combat: 'intellect',
  intellect: 'combat',
  vigor: 'charisma',
  charisma: 'vigor'
};

const props = defineProps<{
  heroId: HeroId;
}>();

defineEmits<{
  viewDetail: [];
}>();

const monsterForm = ref(false);

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
  toggleStartingPower,
  toggleTrainablePower,
  trainingsUsed,
  ep8RecruitIds,
  getSpecialPowerState,
  toggleSpecialPower,
  getSpecialPowerBonusStats,
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

const powerStates = computed(() => getPowerState(props.heroId));

const specialPowerState = computed(() => getSpecialPowerState(props.heroId));

const flightActive = computed(() => flyingHeroIds.value.has(props.heroId));

const bonusLevel = computed(() => getBonusLevel(props.heroId));

const trainingsFull = computed(
  () => trainingsUsed.value >= MAX_POWER_TRAININGS
);

const flightsFull = computed(
  () => flightTrainingsUsed.value >= MAX_FLIGHT_TRAININGS
);

const bonusFull = computed(() => bonusLevelsUsed.value >= MAX_BONUS_POINTS);

const powers = computed(() => HERO_POWERS[props.heroId]);

const upgradePowers = computed((): HeroPowerDefinition[] => {
  if (!powers.value || ep8RecruitIds.value.has(props.heroId)) return [];
  return powers.value.slice(1).filter((p) => p.name !== '');
});

function trainablePowerColor(i: number) {
  return trainablePowerActive(i) ? 'primary' : 'neutral';
}

function trainablePowerActive(i: number) {
  return powerStates.value.trainableSelected === i + 1;
}

function isTrainableDisabled(i: number) {
  return (
    !powerStates.value.startingRevealed ||
    (powerStates.value.trainableSelected !== i + 1 && trainingsFull.value)
  );
}

const flightInfo = computed(
  () => HERO_FLIGHT[props.heroId as keyof typeof HERO_FLIGHT]
);

const flightLocked = computed(() => {
  if (props.heroId === 'blonde-blazer' || props.heroId === 'phenomaman')
    return true;
  return !flightActive.value && flightsFull.value;
});

const flightVisuallyActive = computed(() => {
  if (props.heroId !== 'sonar') return flightActive.value;
  return flightActive.value && monsterForm.value;
});

const flightColor = computed(() =>
  flightVisuallyActive.value
    ? 'primary'
    : flightActive.value
      ? 'secondary'
      : 'neutral'
);

const portraitSrc = computed(() => {
  if (props.heroId === 'sonar') {
    return monsterForm.value
      ? '/images/portraits/sonar-monster.webp'
      : '/images/portraits/sonar-hybrid.webp';
  }
  return `/images/portraits/${props.heroId}.webp`;
});

const canLevelUp = computed(() => !(props.heroId in FIXED_LEVEL_HEROES));

const heroLevel = computed(() => {
  const fixedLevel =
    FIXED_LEVEL_HEROES[props.heroId as keyof typeof FIXED_LEVEL_HEROES];
  if (fixedLevel !== undefined) return fixedLevel;
  // * A bonus level raises the per-hero cap; it does not itself raise the level.
  // * Counting it here made the level jump the moment the bonus was granted,
  // * before the extra point was spent — and disagreed with the detail dialog.
  return 1 + getLevelUpPointsUsedValue.value;
});

const getLevelUpPointsUsedValue = computed(() =>
  getLevelUpPointsUsed(props.heroId)
);

const hasPowers = computed(() => {
  return (
    powerStates.value.startingRevealed ||
    powerStates.value.trainableSelected > 0
  );
});

const showFlambaeSupernova = computed(() => {
  return (
    props.heroId === 'flambae' && powerStates.value.trainableSelected === 2
  );
});

const showCoupeEnPointe = computed(() => {
  return props.heroId === 'coupe' && powerStates.value.startingRevealed;
});

const coupeTooltip = computed(() => {
  const isUpgraded = powerStates.value.trainableSelected === 2;
  const bonus = isUpgraded ? '+3' : '+1';

  if (specialPowerState.value === 1) {
    return `En Pointe: ${bonus} Combat (active)`;
  }
  if (specialPowerState.value === 2) {
    return `En Pointe: ${bonus} Mobility (active)`;
  }
  return `En Pointe: Click to activate ${bonus} Combat or Mobility`;
});

const coupeIcon = computed(() => {
  if (specialPowerState.value === 1) return 'i-lucide-sword';
  if (specialPowerState.value === 2) return 'i-lucide-footprints';
  return 'i-lucide-sparkles';
});

const sonarFormIcon = computed(() => {
  return monsterForm.value ? 'i-lucide-zap' : 'i-lucide-user';
});

const sonarFormTooltip = computed(() => {
  return monsterForm.value ? 'Mega Bat Form' : 'Hybrid Form';
});

function resolvedStat(stat: StatName): StatName {
  if (props.heroId === 'sonar' && monsterForm.value) {
    return MONSTER_FORM_SWAPS[stat] ?? stat;
  }
  return stat;
}
</script>
