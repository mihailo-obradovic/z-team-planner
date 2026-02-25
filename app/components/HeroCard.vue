<template>
  <div
    class="flex gap-4 rounded-lg border border-default bg-elevated p-4 w-92 justify-between"
  >
    <div class="flex flex-col gap-2">
      <NuxtImg
        :src="portraitSrc"
        :alt="hero.name"
        class="aspect-square size-35 rounded-md bg-accented object-cover cursor-pointer hover:ring-2 hover:ring-primary transition-shadow"
        @click="$emit('viewDetail')"
      />
      <div v-if="powers" class="flex justify-center items-center gap-1">
        <TooltipButton
          v-if="heroId === 'sonar'"
          :text="sonarFormTooltip"
          :icon="sonarFormIcon"
          :color="monsterForm ? 'primary' : 'neutral'"
          @click="monsterForm = !monsterForm"
        />

        <TooltipButton
          :text="`${powers[0]!.name}: ${powers[0]!.description}`"
          :icon="POWER_ICONS[0]"
          :color="powerStates.startingRevealed ? 'primary' : 'neutral'"
          @click="togglePower(heroId, 0)"
        />

        <TooltipButton
          v-for="(power, i) in upgradePowers"
          :key="i"
          :text="`${power.name}: ${power.description}`"
          :icon="POWER_ICONS[i + 1]!"
          :color="
            powerStates.trainableSelected === i + 1 ? 'primary' : 'neutral'
          "
          :disabled="powerStates.trainableSelected !== i + 1 && trainingsFull"
          @click="togglePower(heroId, (i + 1) as 0 | 1 | 2)"
        />

        <TooltipButton
          v-if="flightInfo"
          :text="`${flightInfo.name}: ${flightInfo.description}`"
          icon="i-lucide-plane"
          :color="
            flightVisuallyActive
              ? 'primary'
              : flightActive
                ? 'secondary'
                : 'neutral'
          "
          :disabled="flightLocked"
          @click="toggleFlight(heroId)"
        />

        <TooltipButton
          v-if="showFlambaeSupernova"
          text="Supernova: Set Combat and Mobility to 10"
          icon="i-lucide-flame"
          :color="specialPowerState ? 'primary' : 'neutral'"
          @click="toggleSpecialPower(heroId)"
        />

        <TooltipButton
          v-if="showCoupeEnPointe"
          :text="coupeTooltip"
          :icon="coupeIcon"
          :color="specialPowerState ? 'primary' : 'neutral'"
          @click="toggleSpecialPower(heroId)"
        />
      </div>
    </div>

    <div class="flex flex-col flex-1">
      <div class="flex items-center justify-between mb-2">
        <h3 class="text-md font-semibold min-w-18">{{ hero.name }}</h3>
        <div class="flex items-center gap-2 ml-2 mr-0.5">
          <div v-if="canLevelUp" class="w-6 flex items-center justify-center">
            <IconButton
              v-if="
                totalAssignedValue > 0 ||
                hasPowers ||
                flightActive ||
                bonusLevel > 0
              "
              icon="i-lucide-rotate-ccw"
              color="neutral"
              @click="resetHero(heroId)"
            />
          </div>

          <span class="text-xs text-muted w-8 text-end"
            >Lv. {{ heroLevel }}</span
          >

          <div v-if="canLevelUp" class="w-7 flex items-center justify-center">
            <IconButton
              v-if="bonusLevel > 0 || !bonusFull"
              :icon="bonusLevel === 0 ? 'i-lucide-plus-circle' : undefined"
              :color="bonusLevel > 0 ? 'primary' : 'neutral'"
              :disabled="bonusLevel >= 4 || bonusFull"
              @click="incrementBonusLevel(heroId)"
            >
              <span v-if="bonusLevel > 0" class="text-xs font-semibold"
                >+{{ bonusLevel }}</span
              >
            </IconButton>
          </div>
        </div>
      </div>

      <ul class="flex flex-1 flex-col justify-between text-sm">
        <li
          v-for="stat in STAT_NAMES"
          :key="stat"
          class="flex items-center justify-between"
        >
          <span class="capitalize text-muted flex items-center gap-2">
            <NuxtImg
              :src="`/stat-icons/${stat}.webp`"
              :alt="stat"
              class="size-4"
            />
            {{ stat }}
          </span>
          <div class="flex items-center gap-1 ml-2">
            <template v-if="canLevelUp">
              <IconButton
                icon="i-lucide-minus"
                color="neutral"
                :disabled="statBonuses[resolvedStat(stat)] <= 0"
                @click="statDown(heroId, resolvedStat(stat))"
              />
            </template>
            <span class="font-medium w-5 text-center">{{
              hero.startingStats[resolvedStat(stat)] +
              statBonuses[resolvedStat(stat)] +
              specialPowerBonus[resolvedStat(stat)]
            }}</span>
            <template v-if="canLevelUp">
              <IconButton
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
            </template>
          </div>
        </li>
      </ul>
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
  getStatBonuses,
  totalAssigned,
  statUp,
  statDown,
  getBonusLevel,
  incrementBonusLevel,
  bonusLevelsUsed,
  getPowerState,
  togglePower,
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

const hero = computed(() => heroes.value?.find((h) => h.id === props.heroId)!);

const statBonuses = computed(() => getStatBonuses(props.heroId));

const specialPowerBonus = computed(() =>
  getSpecialPowerBonusStats(props.heroId)
);

const pointsRemaining = computed(
  () =>
    MAX_LEVEL_UPS + getBonusLevel(props.heroId) - totalAssigned(props.heroId)
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
  return 1 + totalAssignedValue.value + bonusLevel.value;
});

const totalAssignedValue = computed(() => totalAssigned(props.heroId));

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
