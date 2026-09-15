<template>
  <div class="flex min-w-0 flex-col border-2 border-accented bg-default">
    <!-- ! Comments stay inside the root, so the grid placement the dialog passes falls through. -->
    <!-- * Powers apart from effects: the first is what a training is spent on, the second is what the hero already has or gains. Mixing them made a trained power read as the same kind of thing as a passive. -->
    <!-- ! The frame and the scroll box are two elements on purpose: ScrollRegion draws its edge rules on whichever element scrolls, so a panel that scrolled itself would stack a 1px rule inside its own 2px border. The shell stays static and the region inside it takes the overflow, the padding and the gap. -->
    <ScrollRegion class="flex flex-col p-4 lg:min-h-0 lg:flex-1">
      <Transition name="state-fade" mode="out-in">
        <div :key="heroId" class="flex flex-col gap-4">
          <section class="flex flex-col gap-2">
            <h3 class="font-heading tracking-label text-toned uppercase">
              Powers
            </h3>

            <div
              v-for="(power, index) in displayPowers"
              :key="power.name"
              class="border-2 p-3 transition-colors"
              :class="[
                isPowerActive(power)
                  ? 'border-accented bg-elevated'
                  : 'border-default hover:border-accented/50',
                isPowerDisabled(power)
                  ? 'cursor-not-allowed opacity-50'
                  : 'cursor-pointer'
              ]"
              @click="handleTogglePower(power)"
            >
              <!-- ! `flex-wrap` alone does not do it: without `min-w-0` the name refuses to shrink and pushes the badge past the panel instead of wrapping it. The pair is what lets the badge drop to its own line just over `lg`, where this column is at its narrowest. -->
              <div class="flex flex-wrap items-center gap-2">
                <u-icon :name="POWER_ICONS[index]!" class="size-4 shrink-0" />

                <span class="min-w-0 font-medium">{{ power.name }}</span>

                <u-badge
                  v-if="isPowerActive(power)"
                  :label="power.slot === 'starting' ? 'Revealed' : 'Trained'"
                  size="xs"
                  variant="subtle"
                  class="shrink-0"
                />
              </div>

              <p class="mt-1 text-sm text-muted">
                {{ power.description }}
              </p>
            </div>
          </section>

          <section v-if="hasEffects" class="flex flex-col gap-2">
            <h3 class="font-heading tracking-label text-toned uppercase">
              Effects
            </h3>

            <!-- ! Hidden, not greyed: Heavily Medicated does not disable Fly-Nomenal, it removes it (context/game-mechanics.md, Flight). -->
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
              @click="handleToggleFlight"
            >
              <div class="flex items-center gap-2">
                <u-icon name="i-lucide-plane" class="size-4 shrink-0" />

                <!-- * A hero whose flight the game leaves unnamed still needs a heading here. -->
                <span class="font-medium">
                  {{ flightInfo.name ?? 'Flight' }}
                </span>

                <u-badge
                  v-if="flightActive"
                  label="Trained"
                  size="xs"
                  variant="subtle"
                />
              </div>

              <p class="mt-1 text-sm text-muted">
                {{ flightInfo.description }}
              </p>
            </div>

            <div
              v-if="heroId === 'sonar'"
              class="cursor-pointer border-2 p-3 transition-colors"
              :class="
                monsterForm
                  ? 'border-accented bg-elevated'
                  : 'border-default hover:border-accented/50'
              "
              @click="toggleMonsterForm"
            >
              <div class="flex items-center gap-2">
                <u-icon name="i-lucide-shuffle" class="size-4 shrink-0" />

                <span class="font-medium">Monster form</span>
              </div>

              <p class="mt-1 text-sm text-muted">
                View only — swaps which stats are shown. Nothing is spent and
                nothing is saved.
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
              @click="handleToggleSpecialPower"
            >
              <div class="flex items-center gap-2">
                <u-icon :name="specialAbility.icon" class="size-4 shrink-0" />

                <span class="font-medium">{{ specialAbility.name }}</span>

                <u-badge
                  v-if="specialAbility.active"
                  label="Active"
                  size="xs"
                  variant="subtle"
                />
              </div>

              <!-- ! Every state's line is rendered invisibly in this one grid cell, so the card reserves the tallest of them and keeps its height when the power is toggled. The copy is shorter once active, and at the widths a phone lands on that is the difference between two lines and one — the card used to collapse under the tap and drag everything below it up. Reserving beats a fixed height: the tallest variant is two lines at 393px and one on desktop. -->
              <div class="mt-1 grid">
                <p
                  v-for="variant in specialAbility.descriptionVariants"
                  :key="variant"
                  class="invisible col-start-1 row-start-1 text-sm text-muted"
                  aria-hidden="true"
                >
                  {{ variant }}
                </p>

                <p class="col-start-1 row-start-1 text-sm text-muted">
                  {{ specialAbility.description }}
                </p>
              </div>
            </div>
          </section>
        </div>
      </Transition>
    </ScrollRegion>
  </div>
</template>

<script setup lang="ts">
import {
  HERO_POWERS,
  MAX_POWER_TRAININGS,
  SPECIAL_POWER_MECHANICS
} from '@/types/hero';

import type { HeroId, HeroPowerDefinition } from '@/types/hero';

const POWER_ICONS = [
  'i-lucide-zap',
  'i-lucide-shield',
  'i-lucide-swords'
] as const;

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
    const states = Array.from({ length: mechanics.max + 1 }, (_, each) => each);

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

const hasEffects = computed(
  () =>
    (flightInfo.value && flightShown.value) ||
    props.heroId === 'sonar' ||
    !!specialAbility.value
);

// * One source for the line, so the description shown and the variants reserved behind it can never drift apart.
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

function handleToggleSpecialPower() {
  if (specialAbility.value?.disabled) {
    return;
  }

  toggleSpecialPower(props.heroId);
}
</script>
