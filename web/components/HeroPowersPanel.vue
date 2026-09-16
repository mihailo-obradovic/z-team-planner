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
              @click="handleTogglePower(power)"
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
              v-if="specialAbility"
              :icon="specialAbility.icon"
              :name="specialAbility.name"
              :description="specialAbility.description"
              :description-variants="specialAbility.descriptionVariants"
              :active="specialAbility.active"
              :disabled="specialAbility.disabled"
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

import {
  HERO_POWERS,
  MAX_POWER_TRAININGS,
  SPECIAL_POWER_MECHANICS
} from '@/types/hero';

import type { HeroId, HeroPowerDefinition } from '@/types/hero';

const props = defineProps<{
  heroId: HeroId;
}>();

const {
  getPowerState,
  toggleStartingPower,
  toggleTrainablePower,
  trainingsUsed,
  getSpecialPowerState,
  toggleSpecialPower,
  monsterForm,
  toggleMonsterForm,
  toggleFlight
} = useHeroPlanner();

const { flightActive, flightInfo, flightShown, flightLocked } = useHeroDerived(
  () => props.heroId
);

const displayPowers = computed(() => HERO_POWERS[props.heroId] ?? []);

const powerState = computed(() => getPowerState(props.heroId));

const { specialAbility, handleToggleSpecialPower } = useSpecialAbility();

const hasEffects = computed(
  () =>
    (flightInfo.value && flightShown.value) ||
    props.heroId === 'sonar' ||
    !!specialAbility.value
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

  return (
    !powerState.value.startingRevealed ||
    (powerState.value.trainableSelected !== trainableIndex(power.slot) &&
      trainingsUsed.value >= MAX_POWER_TRAININGS)
  );
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

// * The three special powers, each rendered as one card whose copy follows its state.
function useSpecialAbility() {
  const specialAbility = computed(() => {
    const mechanics =
      SPECIAL_POWER_MECHANICS[
        props.heroId as keyof typeof SPECIAL_POWER_MECHANICS
      ];

    if (!mechanics) {
      return null;
    }

    const state = getSpecialPowerState(props.heroId);

    if (mechanics.type === 'supernova') {
      const description = 'Combat and Mobility set to 10 after two successes.';

      return {
        name: 'Supernova',
        description,
        descriptionVariants: [description],
        icon: 'i-lucide-flame',
        active: state > 0,
        disabled: powerState.value.trainableSelected !== 2
      };
    }

    if (mechanics.type === 'en-pointe') {
      const alaSecondeTrained = powerState.value.trainableSelected === 2;
      const bonus = `+${alaSecondeTrained ? mechanics.upgradeBonus : mechanics.baseBonus}`;

      return {
        name: 'En Pointe',
        description: enPointeDescription(bonus, state),
        descriptionVariants: [0, 1, 2].map((each) =>
          enPointeDescription(bonus, each)
        ),
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

    if (mechanics.type === 'spread-thin') {
      const states = Array.from(
        { length: mechanics.max + 1 },
        (_, each) => each
      );

      return {
        name: 'Spread Thin',
        description: spreadThinDescription(state),
        descriptionVariants: states.map(spreadThinDescription),
        icon: 'i-lucide-expand',
        active: state > 0,
        disabled: powerState.value.trainableSelected !== 1
      };
    }

    return null;
  });

  // * One source, so the shown line and the reserved variants can't drift.
  function spreadThinDescription(state: number): string {
    if (state === 0) {
      return 'Expands into each empty slot, raising every stat 25% per slot.';
    }

    const slots = state === 1 ? '1 slot' : `${state} slots`;
    const percent = state * SPECIAL_POWER_MECHANICS.golem.percentPerSlot * 100;

    return `Expanded into ${slots} — every stat up ${percent}%.`;
  }

  function enPointeDescription(bonus: string, state: number): string {
    const statLabel =
      state === 1 ? 'Combat' : state === 2 ? 'Mobility' : 'Combat or Mobility';

    return `${bonus} ${statLabel} when placed in a specific slot.`;
  }

  function handleToggleSpecialPower() {
    if (specialAbility.value?.disabled) {
      return;
    }

    toggleSpecialPower(props.heroId);
  }

  return { specialAbility, handleToggleSpecialPower };
}
</script>
