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
          <NuxtImg
            :src="portraitSrc"
            :alt="hero.name"
            class="w-full aspect-square rounded-xl bg-accented object-cover"
          />

          <div
            class="rounded-xl border border-default p-6 flex flex-col justify-center gap-4"
          >
            <div class="flex items-baseline gap-3">
              <h2 class="text-3xl font-bold">{{ hero.name }}</h2>

              <span class="text-xl text-muted">Lv. {{ heroLevel }}</span>
            </div>

            <ul class="flex flex-col gap-3">
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

                <span class="text-3xl font-bold tabular-nums w-10 text-center">
                  {{ computedStat(stat) }}
                </span>
              </li>
            </ul>
          </div>

          <div
            class="rounded-xl border border-default bg-elevated/50 p-6 flex items-center justify-center"
          >
            <span class="text-muted text-sm">Radar chart</span>
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
                :class="isFlying ? 'border-accented bg-elevated' : 'border-default'"
              >
                <div class="flex items-center gap-2">
                  <UIcon name="i-lucide-plane" class="size-4" />

                  <span class="font-medium">{{ flightInfo.name }}</span>

                  <UBadge
                    v-if="isFlying"
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
import {
  STAT_NAMES,
  FIXED_LEVEL_HEROES,
  HERO_POWERS,
  HERO_FLIGHT,
  SPECIAL_POWER_MECHANICS
} from '@/types/hero';
import type { HeroId, HeroPowerDefinition, StatName } from '@/types/hero';

const POWER_ICONS = [
  'i-lucide-zap',
  'i-lucide-shield',
  'i-lucide-swords'
] as const;

// ---

const props = defineProps<{
  heroId: HeroId | null;
}>();

defineEmits<{
  close: [];
}>();

// ---

const {
  heroes,
  getStatBonuses,
  totalAssigned,
  getPowerState,
  getSpecialPowerState,
  getSpecialPowerBonusStats,
  getFlightState
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

const portraitSrc = computed(() => {
  if (!props.heroId) return '';
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

const displayPowers = computed(() => {
  if (!powers.value) return [];
  return powers.value.filter((p) => p.name !== '');
});

const flightInfo = computed(() => {
  if (!props.heroId) return null;
  return HERO_FLIGHT[props.heroId as keyof typeof HERO_FLIGHT] ?? null;
});

const isFlying = computed(() => {
  if (!props.heroId) return false;
  return getFlightState(props.heroId);
});

const specialAbility = computed(() => {
  if (!props.heroId) return null;
  const mechanics =
    SPECIAL_POWER_MECHANICS[
      props.heroId as keyof typeof SPECIAL_POWER_MECHANICS
    ];
  if (!mechanics) return null;

  const state = getSpecialPowerState(props.heroId);

  if (mechanics.type === 'supernova') {
    return {
      name: 'Supernova',
      description: 'Combat and Mobility set to 10 after two successes.',
      icon: 'i-lucide-flame',
      active: state > 0
    };
  }

  if (mechanics.type === 'en-pointe') {
    const isUpgraded =
      powerState.value?.trainableSelected === 2;
    const bonus = isUpgraded ? '+3' : '+1';
    const statLabel =
      state === 1 ? 'Combat' : state === 2 ? 'Mobility' : 'Combat or Mobility';
    return {
      name: 'En Pointe',
      description: `${bonus} ${statLabel} when placed in a specific slot.`,
      icon: state === 1 ? 'i-lucide-sword' : state === 2 ? 'i-lucide-footprints' : 'i-lucide-sparkles',
      active: state > 0
    };
  }

  return null;
});

// ---

function computedStat(stat: StatName): number {
  if (!hero.value || !props.heroId) return 0;
  return (
    hero.value.startingStats[stat] +
    getStatBonuses(props.heroId)[stat] +
    getSpecialPowerBonusStats(props.heroId)[stat]
  );
}

function isPowerActive(power: HeroPowerDefinition): boolean {
  if (!powerState.value) return false;
  if (power.slot === 'starting') return powerState.value.startingRevealed;
  if (power.slot === 'trainable-1') return powerState.value.trainableSelected === 1;
  if (power.slot === 'trainable-2') return powerState.value.trainableSelected === 2;
  return false;
}
</script>
