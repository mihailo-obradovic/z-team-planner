<template>
  <u-modal :open="!!heroId" fullscreen @update:open="emit('close')">
    <!-- * The thumbnail rides in the toolbar so the hero is named even below `lg`, where the large portrait is not drawn. -->
    <template #title>
      <span class="flex items-center gap-2">
        <NuxtImg
          :src="portraitSrc"
          :alt="hero?.name ?? ''"
          class="size-6 shrink-0 object-cover object-top"
        />
        {{ hero?.name }}
      </span>
    </template>

    <template #body>
      <div v-if="hero" class="flex h-full min-h-0 gap-4">
        <!-- * Roster rail: square portraits, every one bordered, so the open hero differs by colour rather than by gaining an outline and nudging its neighbours. -->
        <ScrollRegion
          as="nav"
          class="hidden w-24 shrink-0 flex-col gap-2 lg:flex"
          aria-label="Roster"
        >
          <button
            v-for="rosterHero in rosterOrder"
            :key="rosterHero.id"
            type="button"
            class="aspect-square shrink-0 border-2"
            :class="
              rosterHero.id === heroId
                ? 'border-primary'
                : 'border-default opacity-70 hover:opacity-100'
            "
            :aria-current="rosterHero.id === heroId ? 'true' : undefined"
            :aria-label="rosterHero.name"
            @click="emit('select', rosterHero.id)"
          >
            <NuxtImg
              :src="`/images/portraits/${rosterHero.id}.webp`"
              :alt="rosterHero.name"
              class="size-full object-cover object-top"
            />
          </button>
        </ScrollRegion>

        <ScrollRegion class="flex min-w-0 flex-1 flex-col gap-4">
          <!-- * Below `lg` the rail becomes a ribbon: the same shortcut, in the one direction a phone has room for. -->
          <ScrollRegion
            as="nav"
            axis="horizontal"
            class="flex shrink-0 gap-2 lg:hidden"
            aria-label="Roster"
          >
            <button
              v-for="rosterHero in rosterOrder"
              :key="rosterHero.id"
              type="button"
              class="size-14 shrink-0 border-2"
              :class="
                rosterHero.id === heroId
                  ? 'border-primary'
                  : 'border-default opacity-70'
              "
              :aria-current="rosterHero.id === heroId ? 'true' : undefined"
              :aria-label="rosterHero.name"
              @click="emit('select', rosterHero.id)"
            >
              <NuxtImg
                :src="`/images/portraits/${rosterHero.id}.webp`"
                :alt="rosterHero.name"
                class="size-full object-cover object-top"
              />
            </button>
          </ScrollRegion>

          <!-- ! The first two rows are fixed heights on purpose: a fixed-level hero has no steppers and may have no partner, and letting the rows size to content made the whole dialog resize when switching to one. -->
          <!-- ! The base `grid-cols-[minmax(0,1fr)]` is the fix for the iOS sideways scroll, not a restatement of the default: with no columns declared, the single column below `lg` is an implicit `auto` track, and an `auto` track is floored by the largest min-content among its items. `minmax(0,1fr)` removes that floor; the `min-w-0` on each item below removes the matching floor on the items themselves. -->
          <div
            class="grid grid-cols-[minmax(0,1fr)] gap-4 lg:min-h-0 lg:flex-1 lg:grid-cols-[17rem_24rem_minmax(0,1fr)] lg:grid-rows-[18rem_18rem_minmax(0,1fr)]"
          >
            <!-- * Stretched, not square: the two columns beside this one span both rows, and letting the portrait and the radar fill their own rows is what leaves all three ending on the same line. -->
            <div
              class="hidden min-h-0 min-w-0 border-2 border-accented bg-default p-2 lg:block"
            >
              <NuxtImg
                :src="portraitSrc"
                :alt="hero.name"
                class="size-full object-cover object-top"
              />
            </div>

            <div
              class="flex min-w-0 flex-col gap-3 border-2 border-accented bg-default p-3 lg:row-span-2 lg:min-h-0 lg:overflow-y-auto"
            >
              <div
                class="flex items-center gap-4 border-b-2 border-default pb-3"
              >
                <span class="font-heading tracking-label text-toned uppercase">
                  Level
                  <span class="text-lg font-bold text-highlighted">
                    {{ heroLevel }}
                  </span>
                </span>

                <span class="font-heading tracking-label text-toned uppercase">
                  Bonus
                  <span class="text-lg font-bold text-highlighted">
                    {{ bonusLevel }}
                  </span>
                </span>

                <div class="ml-auto flex items-center gap-2">
                  <IconButton
                    icon="i-lucide-plus"
                    color="neutral"
                    size="sm"
                    :disabled="bonusFull || !canLevelUp"
                    label="Add a bonus level"
                    @click="addBonusLevel(heroId!)"
                  />

                  <IconButton
                    icon="i-lucide-rotate-ccw"
                    color="neutral"
                    size="sm"
                    :disabled="!canLevelUp"
                    label="Reset this hero"
                    @click="resetHero(heroId!)"
                  />
                </div>
              </div>

              <!-- * The hero card's stat treatment, scaled up: same structure, same reserved stepper slots, and the special-power bonus folded into the number exactly as the card folds it, so the two can never disagree. -->
              <ul class="flex flex-col gap-1 px-3">
                <li
                  v-for="stat in STAT_NAMES"
                  :key="stat"
                  class="flex items-center justify-between"
                >
                  <span
                    class="flex items-center gap-2 font-heading text-lg tracking-label text-toned uppercase"
                  >
                    <u-icon :name="STAT_ICONS[stat]" class="size-5 shrink-0" />
                    {{ stat }}
                  </span>

                  <div class="ml-2 flex items-center gap-1">
                    <div class="flex w-7 items-center justify-center">
                      <IconButton
                        v-if="canLevelUp"
                        icon="i-lucide-minus"
                        color="neutral"
                        size="sm"
                        :disabled="statBonuses[resolvedStat(stat)] <= 0"
                        :label="`Remove a ${stat} point`"
                        @click="statDown(heroId!, resolvedStat(stat))"
                      />
                    </div>

                    <span class="w-7 text-center text-xl font-bold">
                      {{ computedStat(stat) }}
                    </span>

                    <div class="flex w-7 items-center justify-center">
                      <IconButton
                        v-if="canLevelUp"
                        icon="i-lucide-plus"
                        color="neutral"
                        size="sm"
                        :disabled="isStatCapped(stat)"
                        :label="`Add a ${stat} point`"
                        @click="statUp(heroId!, resolvedStat(stat))"
                      />
                    </div>
                  </div>
                </li>
              </ul>

              <template v-if="synergyPartner">
                <button
                  type="button"
                  class="flex items-center justify-center gap-2 border-2 border-default p-1.5 font-heading tracking-label text-toned uppercase hover:border-accented hover:text-highlighted"
                  @click="emit('select', synergyPartner.id)"
                >
                  <u-icon name="i-lucide-link" class="size-4 shrink-0" />
                  Synergy partner: {{ synergyPartner.name }}
                </button>

                <div class="flex flex-col gap-1 bg-muted p-3">
                  <p class="font-heading tracking-label text-toned uppercase">
                    Pair total
                  </p>

                  <p class="text-sm text-muted">
                    {{ hero.name }} and {{ synergyPartner.name }} combined, with
                    every bonus applied.<template v-if="pairFillsASlot">
                      The pair fills a slot, so Spread Thin counts one
                      fewer.</template
                    >
                  </p>
                </div>

                <!-- ! Read-only, and deliberately: this is the pair's total, but the dialog edits one hero. Steppers here would silently change the partner. -->
                <ul class="flex flex-col gap-1 bg-muted px-3 pb-3">
                  <li
                    v-for="entry in combinedStats"
                    :key="entry.stat"
                    class="flex items-center justify-between"
                  >
                    <span
                      class="flex items-center gap-2 font-heading text-lg tracking-label text-toned uppercase"
                    >
                      <u-icon
                        :name="STAT_ICONS[entry.stat]"
                        class="size-5 shrink-0"
                      />
                      {{ entry.stat }}
                    </span>

                    <div class="ml-2 flex items-center gap-1">
                      <div class="w-7" />

                      <span class="w-7 text-center text-xl font-bold">
                        {{ entry.value }}
                      </span>

                      <div class="w-7" />
                    </div>
                  </li>
                </ul>
              </template>
            </div>

            <div
              class="order-first aspect-square min-w-0 border-2 border-accented bg-default lg:order-none lg:aspect-auto lg:min-h-0"
            >
              <StatRadar :axes="radarAxes" :title="`${hero.name} stats`" />
            </div>

            <!-- * Powers apart from effects: the first is what a training is spent on, the second is what the hero already has or gains. Mixing them made a trained power read as the same kind of thing as a passive. -->
            <div
              class="flex min-w-0 flex-col gap-4 border-2 border-accented bg-default p-4 lg:col-start-3 lg:row-span-2 lg:row-start-1 lg:min-h-0 lg:overflow-y-auto"
            >
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
                  @click="handlePowerClick(power)"
                >
                  <div class="flex items-center gap-2">
                    <u-icon
                      :name="POWER_ICONS[index]!"
                      class="size-4 shrink-0"
                    />

                    <span class="font-medium">{{ power.name }}</span>

                    <u-badge
                      v-if="isPowerActive(power)"
                      :label="
                        power.slot === 'starting' ? 'Revealed' : 'Trained'
                      "
                      size="xs"
                      variant="subtle"
                    />
                  </div>

                  <p class="mt-1 text-sm text-muted">{{ power.description }}</p>
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

                    <span class="font-medium">{{ flightInfo.name }}</span>

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
                  @click="handleToggleForm"
                >
                  <div class="flex items-center gap-2">
                    <u-icon name="i-lucide-shuffle" class="size-4 shrink-0" />

                    <span class="font-medium">Monster form</span>
                  </div>

                  <p class="mt-1 text-sm text-muted">
                    View only — swaps which stats are shown. Nothing is spent
                    and nothing is saved.
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
                    <u-icon
                      :name="specialAbility.icon"
                      class="size-4 shrink-0"
                    />

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

            <!-- * Reserved and not editable: the copy is authored in the repository, and persisting player-written notes would bump the serialized build format (feature 001). -->
            <div
              class="flex min-w-0 flex-col border-2 border-accented bg-default lg:col-span-3 lg:min-h-0"
            >
              <div class="flex plate shrink-0 items-center px-4">
                <span class="font-heading tracking-label text-toned uppercase">
                  Notes
                </span>
              </div>

              <p
                class="p-3 text-sm text-dimmed lg:min-h-0 lg:flex-1 lg:overflow-y-auto"
              >
                Reserved for notes on this hero.
              </p>
            </div>
          </div>
        </ScrollRegion>
      </div>
    </template>
  </u-modal>
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

const emit = defineEmits<{
  close: [];
  select: [heroId: HeroId];
}>();

const monsterForm = ref(false);

const {
  heroes,
  visibleHeroes,
  synergyPairColumns,
  ep8Recruits,
  showEp8Recruits,
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
  getPairSpecialPowerBonusStats,
  flyingHeroIds,
  toggleFlight,
  flightTrainingsUsed,
  resetHero
} = useHeroPlanner();

// * The roster in the order the overview grid draws it — each synergy column top then bottom, then the episode 8 recruits when shown. The rail is a shortcut to those same cards, so it has to agree with them.
const rosterOrder = computed(() => {
  const paired = synergyPairColumns.value.flatMap((column) => [
    column.top,
    column.bottom
  ]);

  return showEp8Recruits.value ? [...paired, ...ep8Recruits.value] : paired;
});

const synergyPartner = computed(() => {
  if (!props.heroId) {
    return null;
  }

  for (const column of synergyPairColumns.value) {
    if (column.top.id === props.heroId) {
      return column.bottom;
    }

    if (column.bottom.id === props.heroId) {
      return column.top;
    }
  }

  return null;
});

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
    const description = 'Combat and Mobility set to 10 after two successes.';

    return {
      name: 'Supernova',
      description,
      descriptionVariants: [description],
      icon: 'i-lucide-flame',
      active: state > 0,
      disabled: !hasRequiredPower
    };
  }

  if (mechanics.type === 'en-pointe') {
    const isUpgraded = powerState.value?.trainableSelected === 2;
    const bonus = isUpgraded ? '+3' : '+1';

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
    const hasRequiredPower = powerState.value?.trainableSelected === 1;
    const states = Array.from({ length: mechanics.max + 1 }, (_, each) => each);

    return {
      name: 'Spread Thin',
      description: spreadThinDescription(state),
      descriptionVariants: states.map(spreadThinDescription),
      icon: 'i-lucide-expand',
      active: state > 0,
      disabled: !hasRequiredPower
    };
  }

  return null;
});

// * One source for the line, so the description shown and the variants reserved behind it can never drift apart.
function spreadThinDescription(state: number): string {
  if (state === 0) {
    return 'Expands into each empty slot, raising every stat 25% per slot.';
  }

  const slots = state === 1 ? '1 slot' : `${state} slots`;

  return `Expanded into ${slots} — every stat up ${state * 25}%.`;
}

function enPointeDescription(bonus: string, state: number): string {
  const statLabel =
    state === 1 ? 'Combat' : state === 2 ? 'Mobility' : 'Combat or Mobility';

  return `${bonus} ${statLabel} when placed in a specific slot.`;
}

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
// * The pair's combined effective stats — this hero plus the partner, each already carrying allocations and any special-power bonus. Read-only: the dialog edits one hero.
const combinedStats = computed(() =>
  STAT_NAMES.map((stat) => {
    const partner = synergyPartner.value;

    const partnerHero = partner
      ? (heroes.value?.find((h) => h.id === partner.id) ?? null)
      : null;

    const partnerValue = partnerHero
      ? partnerHero.startingStats[stat] +
        getStatAllocations(partnerHero.id)[stat] +
        getPairSpecialPowerBonusStats(partnerHero.id)[stat]
      : 0;

    return { stat, value: pairStat(stat) + partnerValue };
  })
);

// * The note only earns its line where a slot-filling power is actually in play — feature 012's deduction is invisible on every other pair.
const pairFillsASlot = computed(() => {
  const ids = [props.heroId, synergyPartner.value?.id];

  return ids.some(
    (id) =>
      id &&
      SPECIAL_POWER_MECHANICS[id as keyof typeof SPECIAL_POWER_MECHANICS]
        ?.type === 'spread-thin'
  );
});

// * This hero's side of the pair total. Same shape as `computedStat`, with the two-hero call's slot deduction applied on top.
function pairStat(stat: StatName): number {
  if (!hero.value || !props.heroId) {
    return 0;
  }

  const resolved = resolvedStat(stat);

  return (
    hero.value.startingStats[resolved] +
    statBonuses.value[resolved] +
    getPairSpecialPowerBonusStats(props.heroId)[resolved]
  );
}

const hasEffects = computed(
  () =>
    (flightInfo.value && flightShown.value) ||
    props.heroId === 'sonar' ||
    !!specialAbility.value
);

// * The cap reads the raw allocation, not the displayed value: a special-power bonus can lift what is shown to 10 while the allocation still has room. Same rule as the hero card.
function isStatCapped(stat: StatName): boolean {
  if (!hero.value) {
    return true;
  }

  const resolved = resolvedStat(stat);

  return (
    pointsRemaining.value <= 0 ||
    hero.value.startingStats[resolved] + statBonuses.value[resolved] >=
      MAX_STAT_VALUE
  );
}

function handleToggleFlight() {
  if (!props.heroId || flightLocked.value) {
    return;
  }

  toggleFlight(props.heroId);
}

function handleToggleSpecialPower() {
  if (!props.heroId || specialAbility.value?.disabled) {
    return;
  }

  toggleSpecialPower(props.heroId);
}
</script>
