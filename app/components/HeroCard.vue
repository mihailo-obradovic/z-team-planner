<template>
  <div
    class="flex gap-4 rounded-lg border border-default bg-elevated p-4 w-104 justify-between"
  >
    <div class="relative">
      <NuxtImg
        :src="portraitSrc"
        :alt="hero.name"
        class="aspect-square size-48 rounded-md bg-accented object-cover"
      />
      <USwitch
        v-if="hero.id === 'sonar'"
        v-model="monsterForm"
        class="absolute bottom-1.5 right-1.5"
      />
    </div>

    <div class="flex flex-col">
      <div class="flex items-center justify-between mb-2">
        <h3 class="text-lg font-semibold">{{ hero.name }}</h3>
        <span class="text-sm text-muted ml-4">Lv. {{ heroLevel }}</span>
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
          <div class="flex items-center gap-1 ml-4">
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
              hero.startingStats[resolvedStat(stat)] + statBonuses[resolvedStat(stat)]
            }}</span>
            <template v-if="canLevelUp">
              <UButton
                icon="i-lucide-plus"
                size="xs"
                variant="soft"
                color="neutral"
                :disabled="
                  pointsRemaining <= 0 ||
                  hero.startingStats[resolvedStat(stat)] + statBonuses[resolvedStat(stat)] >=
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
  MAX_STAT_VALUE
} from '~/types/hero';
import type { HeroId, HeroStats, StatName } from '~/types/hero';

const props = defineProps<{
  hero: {
    id: string;
    name: string;
    startingStats: HeroStats;
  };
  statBonuses: HeroStats;
  pointsRemaining: number;
}>();

defineEmits<{
  statUp: [stat: StatName];
  statDown: [stat: StatName];
}>();

const monsterForm = ref(false);

const portraitSrc = computed(() => {
  if (props.hero.id === 'sonar') {
    return monsterForm.value
      ? '/portraits/sonar-monster.webp'
      : '/portraits/sonar-hybrid.webp';
  }
  return `/portraits/${props.hero.id}.webp`;
});

const MONSTER_FORM_SWAPS: Partial<Record<StatName, StatName>> = {
  combat: 'intellect',
  intellect: 'combat',
  vigor: 'charisma',
  charisma: 'vigor'
};

function resolvedStat(stat: StatName): StatName {
  if (props.hero.id === 'sonar' && monsterForm.value) {
    return MONSTER_FORM_SWAPS[stat] ?? stat;
  }
  return stat;
}

const canLevelUp = computed(() => !(props.hero.id in FIXED_LEVEL_HEROES));

const heroLevel = computed(() => {
  const fixedLevel = FIXED_LEVEL_HEROES[props.hero.id as HeroId];
  if (fixedLevel !== undefined) return fixedLevel;
  return 1 + (MAX_LEVEL_UPS - props.pointsRemaining);
});
</script>
