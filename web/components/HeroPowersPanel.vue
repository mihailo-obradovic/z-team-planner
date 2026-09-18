<template>
  <div class="flex min-w-0 flex-col border-2 border-accented bg-default">
    <!-- ! Comments stay inside the root, so the grid placement the dialog passes falls through. -->
    <!-- * Powers and effects stay apart so a trained power never reads like a passive. -->
    <!-- ! Frame and scroll box are separate elements: ScrollRegion draws edge rules on the scrolling element, which would stack inside the frame's border. -->
    <ScrollRegion class="flex flex-col p-4 lg:min-h-0 lg:flex-1">
      <Transition name="state-fade" mode="out-in">
        <div :key="heroId" class="flex flex-col gap-4">
          <section class="flex flex-col gap-2">
            <h3 class="font-heading tracking-label text-toned uppercase">
              Powers
            </h3>

            <HeroPowerCard
              v-for="(power, index) in displayPowers"
              :key="power.name"
              :icon="POWER_ICONS[index]!"
              :name="power.name"
              :description="power.description"
              :active="isPowerActive(power)"
              :disabled="isPowerDisabled(power)"
              :badge="power.slot === 'starting' ? 'Revealed' : 'Trained'"
              @click="() => handleTogglePower(power)"
            />
          </section>

          <section v-if="hasEffects" class="flex flex-col gap-2">
            <h3 class="font-heading tracking-label text-toned uppercase">
              Effects
            </h3>

            <!-- ! Hidden, not greyed: Heavily Medicated removes Fly-Nomenal rather than disabling it. -->
            <HeroPowerCard
              v-if="flightInfo && flightShown"
              icon="i-lucide-plane"
              :name="flightInfo.name ?? 'Flight'"
              :description="flightInfo.description"
              :active="flightActive"
              :disabled="flightLocked"
              badge="Trained"
              @click="handleToggleFlight"
            />

            <HeroPowerCard
              v-if="heroId === 'sonar'"
              icon="i-lucide-shuffle"
              name="Monster form"
              description="View only — swaps which stats are shown. Nothing is spent and nothing is saved."
              :active="monsterForm"
              @click="toggleMonsterForm"
            />

            <HeroPowerCard
              v-if="specialPower"
              :icon="specialPower.icon"
              :name="specialPower.name"
              :description="specialPower.description"
              :description-variants="specialPower.descriptionVariants"
              :active="specialPower.active"
              :disabled="specialPower.locked"
              badge="Active"
              @click="handleToggleSpecialPower"
            />
          </section>
        </div>
      </Transition>
    </ScrollRegion>
  </div>
</template>

<script setup lang="ts">
import HeroPowerCard from '@/components/HeroPowerCard.vue';

import { HERO_POWERS } from '@/types/hero';

import type { HeroId, HeroPowerDefinition } from '@/types/hero';

const props = defineProps<{
  heroId: HeroId;
}>();

const {
  getPowerState,
  toggleStartingPower,
  toggleTrainablePower,
  toggleSpecialPower,
  monsterForm,
  toggleMonsterForm,
  toggleFlight
} = useHeroPlanner();

const {
  flightActive,
  flightInfo,
  flightShown,
  flightLocked,
  trainablesLocked
} = useHeroDerived(() => props.heroId);

const { specialPower } = useHeroSpecialPower(() => props.heroId);

const displayPowers = computed(() => HERO_POWERS[props.heroId] ?? []);

const powerState = computed(() => getPowerState(props.heroId));

const hasEffects = computed(
  () =>
    (flightInfo.value && flightShown.value) ||
    props.heroId === 'sonar' ||
    !!specialPower.value
);

function isPowerActive(power: HeroPowerDefinition): boolean {
  if (power.slot === 'starting') {
    return powerState.value.startingRevealed;
  }

  return powerState.value.trainableSelected === trainableIndex(power.slot);
}

function isPowerDisabled(power: HeroPowerDefinition): boolean {
  if (power.slot === 'starting') {
    return false;
  }

  return trainablesLocked.value;
}

function trainableIndex(
  slot: Exclude<HeroPowerDefinition['slot'], 'starting'>
): 1 | 2 {
  return slot === 'trainable-1' ? 1 : 2;
}

function handleTogglePower(power: HeroPowerDefinition) {
  if (isPowerDisabled(power)) {
    return;
  }

  if (power.slot === 'starting') {
    toggleStartingPower(props.heroId);

    return;
  }

  toggleTrainablePower(props.heroId, trainableIndex(power.slot));
}

function handleToggleFlight() {
  if (flightLocked.value) {
    return;
  }

  toggleFlight(props.heroId);
}

function handleToggleSpecialPower() {
  if (specialPower.value?.locked) {
    return;
  }

  toggleSpecialPower(props.heroId);
}
</script>
