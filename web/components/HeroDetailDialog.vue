<template>
  <UModal :open="!!heroId" fullscreen @update:open="$emit('close')">
    <template #title>
      <div class="flex items-center gap-2">
        <NuxtImg
          :src="portraitSrc"
          :alt="hero?.name ?? ''"
          class="size-8 border-2 border-accented object-cover md:hidden"
        />

        <span class="font-semibold text-highlighted">{{ hero?.name }}</span>
      </div>
    </template>

    <template #body>
      <div v-if="hero" class="mx-auto flex h-full max-w-7xl flex-col gap-8">
        <div class="flex flex-col gap-6 md:flex-row">
          <div class="hidden md:order-1 md:block md:w-1/4 md:shrink-0">
            <NuxtImg
              :src="portraitSrc"
              :alt="hero.name"
              class="aspect-square w-full border-2 border-accented bg-accented object-cover"
            />
          </div>

          <div
            class="flex flex-col justify-between gap-4 bg-default p-4 panel md:order-2 md:min-h-0 md:w-1/2 md:overflow-auto"
          >
            <div class="flex items-center justify-between">
              <span class="text-lg text-muted">Lv. {{ heroLevel }}</span>

              <div v-if="canLevelUp" class="flex items-center gap-2">
                <IconButton
                  v-if="
                    getLevelUpPointsUsedValue > 0 ||
                    hasPowers ||
                    flightActive ||
                    bonusLevel > 0
                  "
                  icon="i-lucide-rotate-ccw"
                  size="sm"
                  color="neutral"
                  @click="resetHero(heroId!)"
                />

                <IconButton
                  v-if="bonusLevel === 0 && !bonusFull"
                  icon="i-lucide-circle-plus"
                  size="sm"
                  color="neutral"
                  @click="addBonusLevel(heroId!)"
                />

                <IconButton
                  v-else-if="bonusLevel > 0"
                  size="sm"
                  color="primary"
                  :disabled="bonusLevel >= 4 || bonusFull"
                  @click="addBonusLevel(heroId!)"
                >
                  <span class="text-sm font-semibold">+{{ bonusLevel }}</span>
                </IconButton>
              </div>
            </div>

            <ul class="flex flex-1 flex-col justify-center gap-3">
              <li
                v-for="stat in STAT_NAMES"
                :key="stat"
                class="flex items-center gap-4"
              >
                <u-icon :name="STAT_ICONS[stat]" class="size-6 shrink-0" />

                <span
                  class="w-28 font-heading text-lg tracking-label text-toned uppercase"
                >
                  {{ stat }}
                </span>

                <div class="ml-auto flex items-center gap-2">
                  <template v-if="canLevelUp">
                    <IconButton
                      icon="i-lucide-minus"
                      size="sm"
                      color="neutral"
                      :disabled="statBonuses[resolvedStat(stat)] <= 0"
                      @click="statDown(heroId!, resolvedStat(stat))"
                    />
                  </template>

                  <span
                    class="w-10 text-center text-3xl font-bold tabular-nums"
                  >
                    {{ computedStat(stat) }}
                  </span>

                  <span
                    v-if="specialPowerBonusStats[resolvedStat(stat)] !== 0"
                    class="text-sm font-medium text-primary tabular-nums"
                  >
                    ({{
                      specialPowerBonusStats[resolvedStat(stat)] > 0 ? '+' : ''
                    }}{{ specialPowerBonusStats[resolvedStat(stat)] }})
                  </span>

                  <template v-if="canLevelUp">
                    <IconButton
                      icon="i-lucide-plus"
                      size="sm"
                      color="neutral"
                      :disabled="
                        pointsRemaining <= 0 ||
                        hero.startingStats[resolvedStat(stat)] +
                          statBonuses[resolvedStat(stat)] >=
                          MAX_STAT_VALUE
                      "
                      @click="statUp(heroId!, resolvedStat(stat))"
                    />
                  </template>
                </div>
              </li>
            </ul>
          </div>

          <div
            class="order-first flex items-center justify-center bg-default p-0 panel md:order-3 md:min-h-0 md:w-1/3 md:shrink-0 md:overflow-hidden"
          >
            <StatRadar :axes="radarAxes" :title="`${hero.name} stats`" />
          </div>
        </div>

        <div class="flex flex-1 flex-col gap-8">
          <div
            class="grid gap-8"
            :class="
              specialAbility || heroId === 'sonar'
                ? 'grid-cols-2'
                : 'grid-cols-1'
            "
          >
            <div class="flex flex-col gap-4">
              <h3 class="font-heading text-title uppercase">Powers</h3>

              <div
                v-for="(power, i) in displayPowers"
                :key="i"
                class="border-2 p-3 transition-colors"
                :class="[
                  isPowerActive(power)
                    ? 'border-accented bg-elevated'
                    : 'border-default hover:border-accented/50',
                  isPowerDisabled(power)
                    ? 'cursor-not-allowed opacity-50'
                    : 'cursor-pointer'
                ]"
                @click="handlePowerClick(power)"
              >
                <div class="flex items-center gap-2">
                  <UIcon :name="POWER_ICONS[i]" class="size-4" />

                  <span class="font-medium">{{ power.name }}</span>

                  <UBadge
                    v-if="isPowerActive(power)"
                    :label="power.slot === 'starting' ? 'Revealed' : 'Trained'"
                    size="xs"
                    variant="subtle"
                  />
                </div>

                <p class="mt-1 text-sm text-muted">{{ power.description }}</p>
              </div>

              <!-- * Hidden, not greyed: Heavily Medicated does not disable Fly-Nomenal, it removes it (context/game-mechanics.md, Flight). -->
              <div
                v-if="flightInfo && flightShown"
                class="border-2 p-3 transition-colors"
                :class="[
                  flightActive
                    ? 'border-accented bg-elevated'
                    : 'border-default hover:border-accented/50',
                  flightLocked
                    ? 'cursor-not-allowed opacity-50'
                    : 'cursor-pointer'
                ]"
                @click="!flightLocked && toggleFlight(heroId!)"
              >
                <div class="flex items-center gap-2">
                  <UIcon name="i-lucide-plane" class="size-4" />

                  <span class="font-medium">{{ flightInfo.name }}</span>

                  <UBadge
                    v-if="flightActive"
                    label="Active"
                    size="xs"
                    variant="subtle"
                  />
                </div>

                <p class="mt-1 text-sm text-muted">
                  {{ flightInfo.description }}
                </p>
              </div>
            </div>

            <div
              v-if="specialAbility || heroId === 'sonar'"
              class="flex flex-col gap-4"
            >
              <h3 class="font-heading text-title uppercase">Abilities</h3>

              <div
                v-if="heroId === 'sonar'"
                class="cursor-pointer border-2 p-3 transition-colors"
                :class="
                  monsterForm
                    ? 'border-accented bg-elevated'
                    : 'border-default hover:border-accented/50'
                "
                @click="handleToggleForm"
              >
                <div class="flex items-center gap-2">
                  <UIcon
                    :name="monsterForm ? 'i-lucide-zap' : 'i-lucide-user'"
                    class="size-4"
                  />

                  <span class="font-medium">
                    {{ monsterForm ? 'Mega Bat Form' : 'Hybrid Form' }}
                  </span>

                  <UBadge
                    v-if="monsterForm"
                    label="Active"
                    size="xs"
                    variant="subtle"
                  />
                </div>

                <p class="mt-1 text-sm text-muted">
                  {{
                    monsterForm
                      ? 'Combat/Intellect and Vigor/Charisma swapped'
                      : 'Default form — no stat swaps'
                  }}
                </p>
              </div>

              <div
                v-if="specialAbility"
                class="border-2 p-3 transition-colors"
                :class="[
                  specialAbility.active
                    ? 'border-accented bg-elevated'
                    : 'border-default hover:border-accented/50',
                  specialAbility.disabled
                    ? 'cursor-not-allowed opacity-50'
                    : 'cursor-pointer'
                ]"
                @click="!specialAbility.disabled && toggleSpecialPower(heroId!)"
              >
                <div class="flex items-center gap-2">
                  <UIcon :name="specialAbility.icon" class="size-4" />

                  <span class="font-medium">{{ specialAbility.name }}</span>

                  <UBadge
                    v-if="specialAbility.active"
                    label="Active"
                    size="xs"
                    variant="subtle"
                  />
                </div>

                <p class="mt-1 text-sm text-muted">
                  {{ specialAbility.description }}
                </p>
              </div>
            </div>
          </div>

          <div class="flex flex-col gap-2">
            <h3 class="font-heading text-title uppercase">Notes</h3>

            <div class="flex-1 bg-default p-4 panel" />
          </div>
        </div>
      </div>
    </template>
  </UModal>
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
  HERO_FLIGHT,
  HERO_FLIGHT_CAPABILITY,
  SPECIAL_POWER_MECHANICS
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

const RADAR_STAT_ORDER: StatName[] = [
  'combat',
  'vigor',
  'mobility',
  'charisma',
  'intellect'
];

const props = defineProps<{
  heroId: HeroId | null;
}>();

defineEmits<{
  close: [];
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
  getSpecialPowerState,
  toggleSpecialPower,
  getSpecialPowerBonusStats,
  flyingHeroIds,
  toggleFlight,
  flightTrainingsUsed,
  resetHero
} = useHeroPlanner();

const hero = computed(() => {
  if (!props.heroId) {
    return null;
  }
  return heroes.value?.find((h) => h.id === props.heroId) ?? null;
});

const heroLevel = computed(() => {
  if (!props.heroId) {
    return 0;
  }
  const fixedLevel =
    FIXED_LEVEL_HEROES[props.heroId as keyof typeof FIXED_LEVEL_HEROES];
  if (fixedLevel !== undefined) {
    return fixedLevel;
  }
  return 1 + getLevelUpPointsUsed(props.heroId);
});

const canLevelUp = computed(() => {
  if (!props.heroId) {
    return false;
  }
  return !(props.heroId in FIXED_LEVEL_HEROES);
});

const portraitSrc = computed(() => {
  if (!props.heroId) {
    return '';
  }
  if (props.heroId === 'sonar') {
    return monsterForm.value
      ? '/images/portraits/sonar-monster.webp'
      : '/images/portraits/sonar-hybrid.webp';
  }
  return `/images/portraits/${props.heroId}.webp`;
});

const powers = computed(() => {
  if (!props.heroId) {
    return null;
  }
  return HERO_POWERS[props.heroId];
});

const powerState = computed(() => {
  if (!props.heroId) {
    return null;
  }
  return getPowerState(props.heroId);
});

const displayPowers = computed(() => {
  if (!powers.value) {
    return [];
  }
  return powers.value.filter((p) => p.name !== '');
});

const statBonuses = computed(() => {
  if (!props.heroId) {
    return { combat: 0, intellect: 0, vigor: 0, charisma: 0, mobility: 0 };
  }
  return getStatAllocations(props.heroId);
});

const specialPowerBonusStats = computed(() => {
  if (!props.heroId) {
    return { combat: 0, intellect: 0, vigor: 0, charisma: 0, mobility: 0 };
  }
  return getSpecialPowerBonusStats(props.heroId);
});

const getLevelUpPointsUsedValue = computed(() => {
  if (!props.heroId) {
    return 0;
  }
  return getLevelUpPointsUsed(props.heroId);
});

const pointsRemaining = computed(() => {
  if (!props.heroId) {
    return 0;
  }
  return (
    MAX_LEVEL_UPS +
    getBonusLevel(props.heroId) -
    getLevelUpPointsUsed(props.heroId)
  );
});

const bonusLevel = computed(() => {
  if (!props.heroId) {
    return 0;
  }
  return getBonusLevel(props.heroId);
});

const bonusFull = computed(() => bonusLevelsUsed.value >= MAX_BONUS_POINTS);

const flightInfo = computed(() => {
  if (!props.heroId) {
    return null;
  }
  return HERO_FLIGHT[props.heroId as keyof typeof HERO_FLIGHT] ?? null;
});

const flightActive = computed(
  () => !!props.heroId && flyingHeroIds.value.has(props.heroId)
);

const flightShown = computed(() => {
  const capability =
    HERO_FLIGHT_CAPABILITY[props.heroId as keyof typeof HERO_FLIGHT_CAPABILITY];

  if (capability?.type !== 'conditional-power') {
    return true;
  }

  return flightActive.value;
});

const flightLocked = computed(() => {
  if (!props.heroId) {
    return true;
  }
  if (props.heroId === 'blonde-blazer' || props.heroId === 'phenomaman') {
    return true;
  }
  return (
    !flightActive.value && flightTrainingsUsed.value >= MAX_FLIGHT_TRAININGS
  );
});

const specialPowerStateValue = computed(() => {
  if (!props.heroId) {
    return 0;
  }
  return getSpecialPowerState(props.heroId);
});

const hasPowers = computed(() => {
  if (!powerState.value) {
    return false;
  }
  return (
    powerState.value.startingRevealed || powerState.value.trainableSelected > 0
  );
});

const specialAbility = computed(() => {
  if (!props.heroId) {
    return null;
  }
  const mechanics =
    SPECIAL_POWER_MECHANICS[
      props.heroId as keyof typeof SPECIAL_POWER_MECHANICS
    ];
  if (!mechanics) {
    return null;
  }

  const state = specialPowerStateValue.value;

  if (mechanics.type === 'supernova') {
    const hasRequiredPower = powerState.value?.trainableSelected === 2;
    return {
      name: 'Supernova',
      description: 'Combat and Mobility set to 10 after two successes.',
      icon: 'i-lucide-flame',
      active: state > 0,
      disabled: !hasRequiredPower
    };
  }

  if (mechanics.type === 'en-pointe') {
    const isUpgraded = powerState.value?.trainableSelected === 2;
    const bonus = isUpgraded ? '+3' : '+1';
    const statLabel =
      state === 1 ? 'Combat' : state === 2 ? 'Mobility' : 'Combat or Mobility';
    return {
      name: 'En Pointe',
      description: `${bonus} ${statLabel} when placed in a specific slot.`,
      icon:
        state === 1
          ? 'i-lucide-sword'
          : state === 2
            ? 'i-lucide-footprints'
            : 'i-lucide-sparkles',
      active: state > 0,
      disabled: false
    };
  }

  return null;
});

// * The radar takes the same effective value the stat row shows, so the two can never disagree. Axis order is Combat first, which the component puts at the apex, then clockwise — that lands Intellect opposite Vigor and Charisma opposite Mobility.
const radarAxes = computed(() =>
  RADAR_STAT_ORDER.map((stat) => ({
    key: stat,
    label: stat,
    icon: STAT_ICONS[stat],
    value: computedStat(stat)
  }))
);

function handleToggleForm() {
  monsterForm.value = !monsterForm.value;
}

function resolvedStat(stat: StatName): StatName {
  if (props.heroId === 'sonar' && monsterForm.value) {
    return MONSTER_FORM_SWAPS[stat] ?? stat;
  }
  return stat;
}

function computedStat(stat: StatName): number {
  if (!hero.value || !props.heroId) {
    return 0;
  }
  const resolved = resolvedStat(stat);
  return (
    hero.value.startingStats[resolved] +
    statBonuses.value[resolved] +
    specialPowerBonusStats.value[resolved]
  );
}

function isPowerActive(power: HeroPowerDefinition): boolean {
  if (!powerState.value) {
    return false;
  }
  if (power.slot === 'starting') {
    return powerState.value.startingRevealed;
  }
  if (power.slot === 'trainable-1') {
    return powerState.value.trainableSelected === 1;
  }
  if (power.slot === 'trainable-2') {
    return powerState.value.trainableSelected === 2;
  }
  return false;
}

function isPowerDisabled(power: HeroPowerDefinition): boolean {
  if (!props.heroId || !powerState.value) {
    return true;
  }
  if (power.slot === 'starting') {
    return false;
  }
  if (power.slot === 'trainable-1') {
    return (
      !powerState.value.startingRevealed ||
      (powerState.value.trainableSelected !== 1 &&
        trainingsUsed.value >= MAX_POWER_TRAININGS)
    );
  }
  if (power.slot === 'trainable-2') {
    return (
      !powerState.value.startingRevealed ||
      (powerState.value.trainableSelected !== 2 &&
        trainingsUsed.value >= MAX_POWER_TRAININGS)
    );
  }
  return false;
}

function handlePowerClick(power: HeroPowerDefinition) {
  if (!props.heroId || isPowerDisabled(power)) {
    return;
  }
  if (power.slot === 'starting') {
    toggleStartingPower(props.heroId);
    return;
  }
  if (power.slot === 'trainable-1') {
    toggleTrainablePower(props.heroId, 1);
    return;
  }
  if (power.slot === 'trainable-2') {
    toggleTrainablePower(props.heroId, 2);
  }
}
</script>
