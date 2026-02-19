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
        <UTooltip v-if="hero.id === 'sonar'" :text="sonarFormTooltip">
          <UButton
            :icon="sonarFormIcon"
            size="xs"
            :variant="monsterForm ? 'soft' : 'ghost'"
            :color="monsterForm ? 'primary' : 'neutral'"
            @click="monsterForm = !monsterForm"
          />
        </UTooltip>
        <UTooltip :text="`${powers[0]!.name}: ${powers[0]!.description}`">
          <UButton
            :icon="POWER_ICONS[0]"
            size="xs"
            :variant="powerStates.startingRevealed ? 'soft' : 'ghost'"
            :color="powerStates.startingRevealed ? 'primary' : 'neutral'"
            @click="$emit('togglePower', 0)"
          />
        </UTooltip>
        <UTooltip
          v-for="(power, i) in upgradePowers"
          :key="i"
          :text="`${power.name}: ${power.description}`"
        >
          <UButton
            :icon="POWER_ICONS[i + 1]"
            size="xs"
            :variant="powerStates.trainableSelected === (i + 1) ? 'soft' : 'ghost'"
            :color="powerStates.trainableSelected === (i + 1) ? 'primary' : 'neutral'"
            :disabled="powerStates.trainableSelected !== (i + 1) && trainingsFull"
            @click="$emit('togglePower', (i + 1) as 0 | 1 | 2)"
          />
        </UTooltip>
        <UTooltip
          v-if="flightInfo"
          :text="`${flightInfo.name}: ${flightInfo.description}`"
        >
          <UButton
            icon="i-lucide-plane"
            size="xs"
            :variant="flightActive ? 'soft' : 'ghost'"
            :color="
              flightVisuallyActive
                ? 'primary'
                : flightActive
                  ? 'secondary'
                  : 'neutral'
            "
            :disabled="flightLocked"
            @click="$emit('toggleFlight')"
          />
        </UTooltip>
        <UTooltip
          v-if="showFlambaeSupernova"
          text="Supernova: Set Combat and Mobility to 10"
        >
          <UButton
            icon="i-lucide-flame"
            size="xs"
            :variant="specialPowerState ? 'soft' : 'ghost'"
            :color="specialPowerState ? 'primary' : 'neutral'"
            @click="$emit('toggleSpecialPower')"
          />
        </UTooltip>
        <UTooltip v-if="showCoupeEnPointe" :text="coupeTooltip">
          <UButton
            :icon="coupeIcon"
            size="xs"
            :variant="specialPowerState ? 'soft' : 'ghost'"
            :color="specialPowerState ? 'primary' : 'neutral'"
            @click="$emit('toggleSpecialPower')"
          />
        </UTooltip>
      </div>
    </div>

    <div class="flex flex-col">
      <div class="flex items-center justify-between mb-2">
        <h3 class="text-md font-semibold">{{ hero.name }}</h3>
        <div class="flex items-center gap-2 ml-2">
          <UButton
            v-if="
              canLevelUp &&
              (totalAssigned > 0 || hasPowers || flightActive || bonusLevel > 0)
            "
            icon="i-lucide-rotate-ccw"
            size="xs"
            variant="ghost"
            color="neutral"
            @click="() => $emit('resetHero')"
          />
          <span class="text-xs text-muted">Lv. {{ heroLevel }}</span>
          <UButton
            v-if="canLevelUp && bonusLevel === 0 && !bonusFull"
            icon="i-lucide-circle-plus"
            size="xs"
            variant="ghost"
            color="neutral"
            @click="() => $emit('incrementBonus')"
          />
          <UButton
            v-else-if="canLevelUp && bonusLevel > 0"
            size="xs"
            variant="soft"
            color="primary"
            :disabled="bonusLevel >= 4 || bonusFull"
            @click="() => $emit('incrementBonus')"
          >
            <span class="text-xs font-semibold">+{{ bonusLevel }}</span>
          </UButton>
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
              <UButton
                icon="i-lucide-minus"
                size="xs"
                variant="soft"
                color="neutral"
                :disabled="statBonuses[resolvedStat(stat)] <= 0"
                @click="$emit('statDown', resolvedStat(stat))"
              />
            </template>
            <span class="font-medium w-5 text-center">{{
              hero.startingStats[resolvedStat(stat)] +
              statBonuses[resolvedStat(stat)] +
              specialPowerBonus[resolvedStat(stat)]
            }}</span>
            <template v-if="canLevelUp">
              <UButton
                icon="i-lucide-plus"
                size="xs"
                variant="soft"
                color="neutral"
                :disabled="
                  pointsRemaining <= 0 ||
                  hero.startingStats[resolvedStat(stat)] +
                    statBonuses[resolvedStat(stat)] >=
                    MAX_STAT_VALUE
                "
                @click="$emit('statUp', resolvedStat(stat))"
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
  HERO_POWERS,
  HERO_FLIGHT
} from '@/types/hero';
import type {
  HeroId,
  HeroPowerDefinition,
  HeroPowerSelection,
  HeroStats,
  StatName
} from '@/types/hero';

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
  hero: {
    id: string;
    name: string;
    startingStats: HeroStats;
  };
  statBonuses: HeroStats;
  specialPowerBonus: HeroStats;
  pointsRemaining: number;
  powerStates: HeroPowerSelection;
  specialPowerState: number;
  isEp8Recruit: boolean;
  trainingsFull: boolean;
  flightActive: boolean;
  flightsFull: boolean;
  bonusLevel: number;
  bonusFull: boolean;
}>();

defineEmits<{
  statUp: [stat: StatName];
  statDown: [stat: StatName];
  resetHero: [];
  togglePower: [index: 0 | 1 | 2];
  toggleFlight: [];
  toggleSpecialPower: [];
  incrementBonus: [];
  viewDetail: [];
}>();

const monsterForm = ref(false);

const powers = computed(() => HERO_POWERS[props.hero.id as HeroId]);

const upgradePowers = computed((): HeroPowerDefinition[] => {
  if (!powers.value || props.isEp8Recruit) return [];
  return powers.value.slice(1).filter((p) => p.name !== '');
});

const flightInfo = computed(() =>
  HERO_FLIGHT[props.hero.id as HeroId as keyof typeof HERO_FLIGHT]
);

const flightLocked = computed(() => {
  if (props.hero.id === 'blonde-blazer' || props.hero.id === 'phenomaman')
    return true;
  return !props.flightActive && props.flightsFull;
});

const flightVisuallyActive = computed(() => {
  if (props.hero.id !== 'sonar') return props.flightActive;
  return props.flightActive && monsterForm.value;
});

const portraitSrc = computed(() => {
  if (props.hero.id === 'sonar') {
    return monsterForm.value
      ? '/images/portraits/sonar-monster.webp'
      : '/images/portraits/sonar-hybrid.webp';
  }
  return `/images/portraits/${props.hero.id}.webp`;
});

const canLevelUp = computed(() => !(props.hero.id in FIXED_LEVEL_HEROES));

const heroLevel = computed(() => {
  const fixedLevel =
    FIXED_LEVEL_HEROES[
      props.hero.id as HeroId as keyof typeof FIXED_LEVEL_HEROES
    ];
  if (fixedLevel !== undefined) return fixedLevel;
  return 1 + (MAX_LEVEL_UPS - props.pointsRemaining) + props.bonusLevel;
});

const totalAssigned = computed(() => {
  return STAT_NAMES.reduce((sum, s) => sum + props.statBonuses[s], 0);
});

const hasPowers = computed(() => {
  return (
    props.powerStates.startingRevealed || props.powerStates.trainableSelected > 0
  );
});

const showFlambaeSupernova = computed(() => {
  return props.hero.id === 'flambae' && props.powerStates.trainableSelected === 2;
});

const showCoupeEnPointe = computed(() => {
  return props.hero.id === 'coupe' && props.powerStates.startingRevealed;
});

const coupeTooltip = computed(() => {
  const isUpgraded = props.powerStates.trainableSelected === 2;
  const bonus = isUpgraded ? '+3' : '+1';

  if (props.specialPowerState === 1) {
    return `En Pointe: ${bonus} Combat (active)`;
  }
  if (props.specialPowerState === 2) {
    return `En Pointe: ${bonus} Mobility (active)`;
  }
  return `En Pointe: Click to activate ${bonus} Combat or Mobility`;
});

const coupeIcon = computed(() => {
  if (props.specialPowerState === 1) return 'i-lucide-sword';
  if (props.specialPowerState === 2) return 'i-lucide-footprints';
  return 'i-lucide-sparkles';
});

const sonarFormIcon = computed(() => {
  return monsterForm.value ? 'i-lucide-zap' : 'i-lucide-user';
});

const sonarFormTooltip = computed(() => {
  return monsterForm.value ? 'Mega Bat Form' : 'Hybrid Form';
});

function resolvedStat(stat: StatName): StatName {
  if (props.hero.id === 'sonar' && monsterForm.value) {
    return MONSTER_FORM_SWAPS[stat] ?? stat;
  }
  return stat;
}
</script>
