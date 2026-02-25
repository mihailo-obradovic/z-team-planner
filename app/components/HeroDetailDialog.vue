<template>
  <UModal
    :open="!!heroId"
    fullscreen
    :title="hero?.name"
    @update:open="$emit('close')"
  >
    <template #body>
      <div v-if="hero" class="flex flex-col gap-8 max-w-7xl mx-auto h-full">
        <div class="grid grid-cols-3 gap-8">
          <div class="flex flex-col gap-3">
            <NuxtImg
              :src="portraitSrc"
              :alt="hero.name"
              class="w-full aspect-square rounded-xl bg-accented object-cover"
            />

            <div v-if="powers" class="flex justify-center items-center gap-2">
              <TooltipButton
                v-if="heroId === 'sonar'"
                :text="sonarFormTooltip"
                :icon="sonarFormIcon"
                size="sm"
                :color="monsterForm ? 'primary' : 'neutral'"
                @click="monsterForm = !monsterForm"
              />

              <TooltipButton
                :text="`${powers[0]!.name}: ${powers[0]!.description}`"
                :icon="POWER_ICONS[0]"
                size="sm"
                :color="powerState!.startingRevealed ? 'primary' : 'neutral'"
                @click="togglePower(heroId!, 0)"
              />

              <TooltipButton
                v-for="(power, i) in upgradePowers"
                :key="i"
                :text="`${power.name}: ${power.description}`"
                :icon="POWER_ICONS[i + 1]!"
                size="sm"
                :color="powerState!.trainableSelected === i + 1 ? 'primary' : 'neutral'"
                :disabled="powerState!.trainableSelected !== i + 1 && trainingsUsed >= MAX_POWER_TRAININGS"
                @click="togglePower(heroId!, (i + 1) as 0 | 1 | 2)"
              />

              <TooltipButton
                v-if="flightInfo"
                :text="`${flightInfo.name}: ${flightInfo.description}`"
                icon="i-lucide-plane"
                size="sm"
                :color="flightVisuallyActive ? 'primary' : flightActive ? 'secondary' : 'neutral'"
                :disabled="flightLocked"
                @click="toggleFlight(heroId!)"
              />

              <TooltipButton
                v-if="showFlambaeSupernova"
                text="Supernova: Set Combat and Mobility to 10"
                icon="i-lucide-flame"
                size="sm"
                :color="specialPowerStateValue ? 'primary' : 'neutral'"
                @click="toggleSpecialPower(heroId!)"
              />

              <TooltipButton
                v-if="showCoupeEnPointe"
                :text="coupeTooltip"
                :icon="coupeIcon"
                size="sm"
                :color="specialPowerStateValue ? 'primary' : 'neutral'"
                @click="toggleSpecialPower(heroId!)"
              />
            </div>
          </div>

          <div
            class="rounded-xl border border-default p-6 flex flex-col justify-between gap-4"
          >
            <div class="flex items-center justify-between">
              <span class="text-xl text-muted">Lv. {{ heroLevel }}</span>

              <div v-if="canLevelUp" class="flex items-center gap-2">
                <IconButton
                  v-if="
                    totalAssignedValue > 0 ||
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
                  @click="incrementBonusLevel(heroId!)"
                />

                <IconButton
                  v-else-if="bonusLevel > 0"
                  size="sm"
                  color="primary"
                  :disabled="bonusLevel >= 4 || bonusFull"
                  @click="incrementBonusLevel(heroId!)"
                >
                  <span class="text-xs font-semibold">+{{ bonusLevel }}</span>
                </IconButton>
              </div>
            </div>

            <ul class="flex flex-col gap-3 flex-1 justify-center">
              <li
                v-for="stat in STAT_NAMES"
                :key="stat"
                class="flex items-center gap-4"
              >
                <NuxtImg
                  :src="`/stat-icons/${stat}.webp`"
                  :alt="stat"
                  class="size-8"
                />

                <span class="text-lg capitalize text-muted w-28">
                  {{ stat }}
                </span>

                <div class="flex items-center gap-2 ml-auto">
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
                    class="text-3xl font-bold tabular-nums w-10 text-center"
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

            <div
              v-if="heroId === 'sonar'"
              class="text-xs text-muted text-center"
            >
              {{
                monsterForm
                  ? 'Mega Bat form: Combat/Intellect and Vigor/Charisma swapped'
                  : 'Hybrid form'
              }}
            </div>
          </div>

          <div
            class="radar-chart rounded-xl border border-default bg-elevated/50 p-6 flex items-center justify-center"
          >
            <ClientOnly>
              <VueUiRadar :dataset="radarDataset" :config="radarConfig" />
            </ClientOnly>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-8 flex-1">
          <div class="flex flex-col gap-4">
            <h3 class="text-lg font-semibold">Powers</h3>

            <div
              v-for="(power, i) in displayPowers"
              :key="i"
              class="rounded-lg border p-3"
              :class="
                isPowerActive(power)
                  ? 'border-accented bg-elevated'
                  : 'border-default'
              "
            >
              <div class="flex items-center gap-2">
                <UIcon :name="POWER_ICONS[i]" class="size-4" />

                <span class="font-medium">{{ power.name }}</span>

                <UBadge
                  v-if="isPowerActive(power)"
                  label="Trained"
                  size="xs"
                  variant="subtle"
                />
              </div>

              <p class="text-sm text-muted mt-1">{{ power.description }}</p>
            </div>

            <template v-if="flightInfo || specialAbility">
              <h3 class="text-lg font-semibold mt-2">Abilities</h3>

              <div
                v-if="flightInfo"
                class="rounded-lg border p-3"
                :class="
                  flightActive ? 'border-accented bg-elevated' : 'border-default'
                "
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

                <p class="text-sm text-muted mt-1">
                  {{ flightInfo.description }}
                </p>
              </div>

              <div
                v-if="specialAbility"
                class="rounded-lg border p-3"
                :class="
                  specialAbility.active
                    ? 'border-accented bg-elevated'
                    : 'border-default'
                "
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

                <p class="text-sm text-muted mt-1">
                  {{ specialAbility.description }}
                </p>
              </div>
            </template>
          </div>

          <div class="flex flex-col gap-2">
            <h3 class="text-lg font-semibold">Notes</h3>

            <div
              class="flex-1 rounded-xl border border-default bg-elevated/50 p-4"
            />
          </div>
        </div>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import type { VueUiRadarConfig, VueUiRadarDataset } from 'vue-data-ui';

const VueUiRadar = defineAsyncComponent(() =>
  import('vue-data-ui').then((m) => m.VueUiRadar)
);

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

// ---

const props = defineProps<{
  heroId: HeroId | null;
}>();

defineEmits<{
  close: [];
}>();

// ---

const monsterForm = ref(false);

// ---

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

// ---

const hero = computed(() => {
  if (!props.heroId) return null;
  return heroes.value?.find((h) => h.id === props.heroId) ?? null;
});

const heroLevel = computed(() => {
  if (!props.heroId) return 0;
  const fixedLevel =
    FIXED_LEVEL_HEROES[props.heroId as keyof typeof FIXED_LEVEL_HEROES];
  if (fixedLevel !== undefined) return fixedLevel;
  return 1 + totalAssigned(props.heroId);
});

const canLevelUp = computed(() => {
  if (!props.heroId) return false;
  return !(props.heroId in FIXED_LEVEL_HEROES);
});

const portraitSrc = computed(() => {
  if (!props.heroId) return '';
  if (props.heroId === 'sonar') {
    return monsterForm.value
      ? '/images/portraits/sonar-monster.webp'
      : '/images/portraits/sonar-hybrid.webp';
  }
  return `/images/portraits/${props.heroId}.webp`;
});

const powers = computed(() => {
  if (!props.heroId) return null;
  return HERO_POWERS[props.heroId];
});

const powerState = computed(() => {
  if (!props.heroId) return null;
  return getPowerState(props.heroId);
});

const upgradePowers = computed((): HeroPowerDefinition[] => {
  if (!powers.value || !props.heroId || ep8RecruitIds.value.has(props.heroId)) return [];
  return powers.value.slice(1).filter((p) => p.name !== '');
});

const displayPowers = computed(() => {
  if (!powers.value) return [];
  return powers.value.filter((p) => p.name !== '');
});

const statBonuses = computed(() => {
  if (!props.heroId)
    return { combat: 0, intellect: 0, vigor: 0, charisma: 0, mobility: 0 };
  return getStatBonuses(props.heroId);
});

const specialPowerBonusStats = computed(() => {
  if (!props.heroId)
    return { combat: 0, intellect: 0, vigor: 0, charisma: 0, mobility: 0 };
  return getSpecialPowerBonusStats(props.heroId);
});

const totalAssignedValue = computed(() => {
  if (!props.heroId) return 0;
  return totalAssigned(props.heroId);
});

const pointsRemaining = computed(() => {
  if (!props.heroId) return 0;
  return (
    MAX_LEVEL_UPS + getBonusLevel(props.heroId) - totalAssigned(props.heroId)
  );
});

const bonusLevel = computed(() => {
  if (!props.heroId) return 0;
  return getBonusLevel(props.heroId);
});

const bonusFull = computed(() => bonusLevelsUsed.value >= MAX_BONUS_POINTS);

const flightInfo = computed(() => {
  if (!props.heroId) return null;
  return HERO_FLIGHT[props.heroId as keyof typeof HERO_FLIGHT] ?? null;
});

const flightActive = computed(() => !!props.heroId && flyingHeroIds.value.has(props.heroId));

const flightLocked = computed(() => {
  if (!props.heroId) return true;
  if (props.heroId === 'blonde-blazer' || props.heroId === 'phenomaman')
    return true;
  return (
    !flightActive.value && flightTrainingsUsed.value >= MAX_FLIGHT_TRAININGS
  );
});

const flightVisuallyActive = computed(() => {
  if (props.heroId !== 'sonar') return flightActive.value;
  return flightActive.value && monsterForm.value;
});


const specialPowerStateValue = computed(() => {
  if (!props.heroId) return 0;
  return getSpecialPowerState(props.heroId);
});

const hasPowers = computed(() => {
  if (!powerState.value) return false;
  return (
    powerState.value.startingRevealed || powerState.value.trainableSelected > 0
  );
});

const showFlambaeSupernova = computed(() => {
  if (!props.heroId || !powerState.value) return false;
  return props.heroId === 'flambae' && powerState.value.trainableSelected === 2;
});

const showCoupeEnPointe = computed(() => {
  if (!props.heroId || !powerState.value) return false;
  return props.heroId === 'coupe' && powerState.value.startingRevealed;
});

const coupeTooltip = computed(() => {
  if (!powerState.value) return '';
  const isUpgraded = powerState.value.trainableSelected === 2;
  const bonus = isUpgraded ? '+3' : '+1';
  if (specialPowerStateValue.value === 1)
    return `En Pointe: ${bonus} Combat (active)`;
  if (specialPowerStateValue.value === 2)
    return `En Pointe: ${bonus} Mobility (active)`;
  return `En Pointe: Click to activate ${bonus} Combat or Mobility`;
});

const coupeIcon = computed(() => {
  if (specialPowerStateValue.value === 1) return 'i-lucide-sword';
  if (specialPowerStateValue.value === 2) return 'i-lucide-footprints';
  return 'i-lucide-sparkles';
});

const sonarFormIcon = computed(() => {
  return monsterForm.value ? 'i-lucide-zap' : 'i-lucide-user';
});

const sonarFormTooltip = computed(() => {
  return monsterForm.value ? 'Mega Bat Form' : 'Hybrid Form';
});

const specialAbility = computed(() => {
  if (!props.heroId) return null;
  const mechanics =
    SPECIAL_POWER_MECHANICS[
      props.heroId as keyof typeof SPECIAL_POWER_MECHANICS
    ];
  if (!mechanics) return null;

  const state = specialPowerStateValue.value;

  if (mechanics.type === 'supernova') {
    return {
      name: 'Supernova',
      description: 'Combat and Mobility set to 10 after two successes.',
      icon: 'i-lucide-flame',
      active: state > 0
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
      active: state > 0
    };
  }

  return null;
});

const RADAR_STAT_ORDER: StatName[] = [
  'combat',
  'vigor',
  'mobility',
  'charisma',
  'intellect'
];

const radarDataset = computed(
  (): VueUiRadarDataset => ({
    categories: [{ name: hero.value?.name ?? '' }],
    series: RADAR_STAT_ORDER.map((stat) => ({
      name: stat.charAt(0).toUpperCase() + stat.slice(1),
      values: [computedStat(stat)],
      target: 10
    }))
  })
);

const radarConfig = computed(
  (): VueUiRadarConfig => ({
    responsive: true,
    useCssAnimation: true,
    style: {
      fontFamily: 'inherit',
      chart: {
        backgroundColor: 'transparent',
        color: 'currentColor',
        layout: {
          grid: {
            show: true,
            stroke: 'var(--ui-border)',
            strokeWidth: 0.5,
            graduations: 10
          },
          outerPolygon: {
            stroke: 'var(--ui-border)',
            strokeWidth: 1
          },
          dataPolygon: {
            strokeWidth: 2,
            opacity: 0.2,
            useGradient: false
          },
          plots: {
            show: true,
            radius: 3
          },
          labels: {
            dataLabels: {
              show: true,
              fontSize: 12,
              color: 'currentColor'
            }
          }
        },
        legend: {
          show: false
        },
        title: {
          text: ''
        },
        tooltip: {
          show: false
        }
      }
    },
    userOptions: {
      show: false
    },
    table: {
      show: false
    }
  })
);

// ---

function resolvedStat(stat: StatName): StatName {
  if (props.heroId === 'sonar' && monsterForm.value) {
    return MONSTER_FORM_SWAPS[stat] ?? stat;
  }
  return stat;
}

function computedStat(stat: StatName): number {
  if (!hero.value || !props.heroId) return 0;
  const resolved = resolvedStat(stat);
  return (
    hero.value.startingStats[resolved] +
    statBonuses.value[resolved] +
    specialPowerBonusStats.value[resolved]
  );
}

function isPowerActive(power: HeroPowerDefinition): boolean {
  if (!powerState.value) return false;
  if (power.slot === 'starting') return powerState.value.startingRevealed;
  if (power.slot === 'trainable-1')
    return powerState.value.trainableSelected === 1;
  if (power.slot === 'trainable-2')
    return powerState.value.trainableSelected === 2;
  return false;
}
</script>

<style scoped>
.radar-chart :deep(svg) {
  transform: rotate(-90deg);
}

.radar-chart :deep(svg text) {
  transform-box: fill-box;
  transform-origin: center;
  transform: rotate(90deg);
}
</style>
