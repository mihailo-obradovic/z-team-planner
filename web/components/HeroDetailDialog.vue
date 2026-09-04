<template>
  <u-modal :open="!!heroId" fullscreen @update:open="emit('close')">
    <!-- * The thumbnail rides in the toolbar so the hero is named even below `lg`, where the large portrait is not drawn. -->
    <template #title>
      <span class="flex items-center gap-2">
        <HeroPortrait
          v-if="heroId"
          :hero-id="heroId"
          usage="header"
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
          ref="rosterRail"
          as="nav"
          class="hidden w-24 shrink-0 flex-col gap-2 lg:flex"
          aria-label="Roster"
        >
          <button
            v-for="rosterHero in rosterOrder"
            ref="railTile"
            :key="rosterHero.id"
            type="button"
            class="aspect-square shrink-0 border-2 select-none"
            :class="
              rosterHero.id === heroId
                ? 'border-primary'
                : 'border-default opacity-70 hover:opacity-100'
            "
            :aria-current="rosterHero.id === heroId ? 'true' : undefined"
            :aria-label="rosterHero.name"
            @click="handleRosterSelect(rosterHero.id, $event)"
          >
            <HeroPortrait
              :hero-id="rosterHero.id"
              usage="rail"
              :alt="rosterHero.name"
              class="size-full object-cover object-top"
            />
          </button>
        </ScrollRegion>

        <ScrollRegion class="flex min-w-0 flex-1 flex-col gap-4">
          <!-- * Below `lg` the rail becomes a ribbon: the same shortcut, in the one direction a phone has room for. -->
          <ScrollRegion
            ref="rosterRibbon"
            as="nav"
            axis="horizontal"
            class="flex shrink-0 gap-2 lg:hidden"
            aria-label="Roster"
          >
            <button
              v-for="rosterHero in rosterOrder"
              ref="ribbonTile"
              :key="rosterHero.id"
              type="button"
              class="size-14 shrink-0 border-2 select-none"
              :class="
                rosterHero.id === heroId
                  ? 'border-primary'
                  : 'border-default opacity-70'
              "
              :aria-current="rosterHero.id === heroId ? 'true' : undefined"
              :aria-label="rosterHero.name"
              @click="handleRosterSelect(rosterHero.id, $event)"
            >
              <HeroPortrait
                :hero-id="rosterHero.id"
                usage="ribbon"
                :alt="rosterHero.name"
                class="size-full object-cover object-top"
              />
            </button>
          </ScrollRegion>

          <!-- * Three tiers, on viewport breakpoints rather than container queries: the dialog is fullscreen, so its width is the viewport and a container query would be measuring the same number twice. -->
          <!-- * At `md` the portrait comes back above the radar in a column of its own and the stats sit beside them; powers and notes fall into implicit rows below and size to content, so the body scrolls rather than the panels. -->
          <!-- ! The first two rows are fixed heights on purpose: a fixed-level hero has no steppers and may have no partner, and letting the rows size to content made the whole dialog resize when switching to one. -->
          <!-- ! The base `grid-cols-[minmax(0,1fr)]` is the fix for the iOS sideways scroll, not a restatement of the default: with no columns declared, the single column below `lg` is an implicit `auto` track, and an `auto` track is floored by the largest min-content among its items. `minmax(0,1fr)` removes that floor; the `min-w-0` on each item below removes the matching floor on the items themselves. -->
          <div
            class="grid grid-cols-[minmax(0,1fr)] gap-4 md:grid-cols-[17rem_minmax(0,1fr)] md:grid-rows-[18rem_18rem] lg:min-h-0 lg:flex-1 lg:grid-cols-[17rem_24rem_minmax(0,1fr)] lg:grid-rows-[18rem_18rem_minmax(0,1fr)]"
          >
            <!-- * Stretched, not square: the two columns beside this one span both rows, and letting the portrait and the radar fill their own rows is what leaves all three ending on the same line. -->
            <div
              class="hidden min-h-0 min-w-0 border-2 border-accented bg-default p-2 md:block"
            >
              <HeroPortrait
                :hero-id="hero.id"
                usage="panel"
                :alt="hero.name"
                class="size-full object-cover object-top"
              />
            </div>

            <!-- ! Split into a static shell and an inner scroll box for the reason the powers panel below is: the element carrying `overflow` never also carries a structural border. -->
            <div
              class="flex min-w-0 flex-col border-2 border-accented bg-default md:row-span-2 md:min-h-0 lg:row-span-2 lg:min-h-0"
            >
              <ScrollRegion
                class="flex flex-col gap-3 p-3 md:min-h-0 md:flex-1 lg:min-h-0 lg:flex-1"
              >
                <div
                  class="flex items-center gap-4 border-b-2 border-default pb-3"
                >
                  <span
                    class="font-heading tracking-label text-toned uppercase"
                  >
                    Level
                    <span
                      class="text-lg font-bold text-highlighted select-none"
                    >
                      {{ heroLevel }}
                    </span>
                  </span>

                  <span
                    class="font-heading tracking-label text-toned uppercase"
                  >
                    Bonus
                    <span
                      class="text-lg font-bold text-highlighted select-none"
                    >
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
                      <u-icon
                        :name="STAT_ICONS[stat]"
                        class="size-5 shrink-0"
                      />
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

                    <!-- ! Reserves the two-sentence Spread Thin variant's height even when it isn't shown — otherwise this block was one line shorter for every hero but Golem's pair, and that one hero pushed the fixed-height column into scroll (feature 011). -->
                    <div aria-label="Pair total description" class="grid">
                      <p
                        v-for="variant in pairTotalDescriptionVariants"
                        :key="variant"
                        class="invisible col-start-1 row-start-1 text-sm text-muted"
                        aria-hidden="true"
                      >
                        {{ variant }}
                      </p>

                      <p class="col-start-1 row-start-1 text-sm text-muted">
                        {{ pairTotalDescription }}
                      </p>
                    </div>
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
              </ScrollRegion>
            </div>

            <!-- ! Capped from `sm`, not left to the column. The frame is `aspect-square` at the column's full width, and the dialog is fullscreen, so between 640 and 1023 the radar was a square as wide as the viewport and pushed everything else off screen. From `md` it has a column of its own and fills it instead, which is why the cap and the centring are dropped there rather than at `lg`. -->
            <!-- ! `w-full` is load-bearing beside the cap, and `mx-auto` is not what centres this. Auto margins on a grid item drop it out of `stretch` and size it to its content — which for a `viewBox`-only SVG is the replaced-element default of 300px, so the frame measured 304 against a 320 cap that never bound. Width 100% capped by `max-w-80`, centred by the grid, is what actually holds. -->
            <div
              class="order-first aspect-square min-w-0 border-2 border-accented bg-default sm:w-full sm:max-w-80 sm:justify-self-center md:order-none md:aspect-auto md:min-h-0 md:max-w-none md:justify-self-auto lg:order-none lg:aspect-auto lg:min-h-0"
            >
              <StatRadar :axes="radarAxes" :title="`${hero.name} stats`" />
            </div>

            <!-- * Powers apart from effects: the first is what a training is spent on, the second is what the hero already has or gains. Mixing them made a trained power read as the same kind of thing as a passive. -->
            <!-- ! The frame and the scroll box are two elements on purpose: ScrollRegion draws its edge rules on whichever element scrolls, so a panel that scrolled itself would stack a 1px rule inside its own 2px border. The shell stays static and the region inside it takes the overflow, the padding and the gap. -->
            <div
              class="flex min-w-0 flex-col border-2 border-accented bg-default md:col-span-2 lg:col-span-1 lg:col-start-3 lg:row-span-2 lg:row-start-1 lg:min-h-0"
            >
              <ScrollRegion
                class="flex flex-col gap-4 p-4 lg:min-h-0 lg:flex-1"
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
                    @click="handleTogglePower(power)"
                  >
                    <!-- ! `flex-wrap` alone does not do it: without `min-w-0` the name refuses to shrink and pushes the badge past the panel instead of wrapping it. The pair is what lets the badge drop to its own line just over `lg`, where this column is at its narrowest. -->
                    <div class="flex flex-wrap items-center gap-2">
                      <u-icon
                        :name="POWER_ICONS[index]!"
                        class="size-4 shrink-0"
                      />

                      <span class="min-w-0 font-medium">{{ power.name }}</span>

                      <u-badge
                        v-if="isPowerActive(power)"
                        :label="
                          power.slot === 'starting' ? 'Revealed' : 'Trained'
                        "
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
              </ScrollRegion>
            </div>

            <!-- * Content is authored (feature 022): a hero note plus zero or more advisories, never player-written or persisted. -->
            <div
              class="flex min-w-0 flex-col border-2 border-accented bg-default md:col-span-2 lg:col-span-3 lg:min-h-0"
            >
              <div class="flex plate shrink-0 items-center px-4">
                <span class="font-heading tracking-label text-toned uppercase">
                  Notes
                </span>
              </div>

              <ScrollRegion
                as="ul"
                aria-label="Notes"
                class="flex list-inside list-disc flex-col gap-2 p-4 text-base marker:text-muted lg:min-h-0 lg:flex-1"
              >
                <li v-if="heroNote" class="text-muted">{{ heroNote }}</li>
                <li
                  v-for="advisory in heroAdvisories"
                  :key="advisory.id"
                  class="text-muted"
                >
                  {{ advisory.text }}
                </li>
              </ScrollRegion>
            </div>
          </div>
        </ScrollRegion>
      </div>
    </template>
  </u-modal>
</template>

<script setup lang="ts">
import HeroPortrait from '@/components/HeroPortrait.vue';

import {
  STAT_NAMES,
  MAX_STAT_VALUE,
  MAX_POWER_TRAININGS,
  HERO_POWERS,
  SPECIAL_POWER_MECHANICS
} from '@/types/hero';

import type { HeroId, HeroPowerDefinition, StatName } from '@/types/hero';

const POWER_ICONS = [
  'i-lucide-zap',
  'i-lucide-shield',
  'i-lucide-swords'
] as const;

// * What this component needs of a `ScrollRegion`: the one method it calls. Structural rather than the
// * component's own instance type, so the dialog does not import a component it renders by auto-import.
type RosterStrip = { bringIntoView: (target: HTMLElement) => void };

const props = defineProps<{
  heroId: HeroId | null;
}>();

const emit = defineEmits<{
  close: [];
  select: [heroId: HeroId];
}>();

// * Both rails are mounted at every width — one is `display: none` — so both are asked to follow and the
// * hidden one measures zero and no-ops. Nothing here has to know which tier is on screen.
const rosterRail = useTemplateRef<RosterStrip>('rosterRail');
const rosterRibbon = useTemplateRef<RosterStrip>('rosterRibbon');
const railTiles = useTemplateRef<HTMLElement[]>('railTile');
const ribbonTiles = useTemplateRef<HTMLElement[]>('ribbonTile');

const {
  visibleHeroes,
  synergyPairColumns,
  ep8Recruits,
  showEp8Recruits,
  statUp,
  statDown,
  addBonusLevel,
  getPowerState,
  toggleStartingPower,
  toggleTrainablePower,
  trainingsUsed,
  getSpecialPowerState,
  toggleSpecialPower,
  getEffectiveStats,
  getPairCombinedStats,
  monsterForm,
  toggleMonsterForm,
  toggleFlight,
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

// * A tile the user reached for is followed on the click itself, not through the watcher: clicking the
// * hero already open changes nothing to watch, and a half-clipped tile should still come whole (feature 019).
function handleRosterSelect(heroId: HeroId, event: MouseEvent) {
  const tile = event.currentTarget;

  if (tile instanceof HTMLElement) {
    rosterRail.value?.bringIntoView(tile);
    rosterRibbon.value?.bringIntoView(tile);
  }

  emit('select', heroId);
}

// * The roster control is the only thing in the dialog saying where you are in the roster, so the marked
// * tile is brought into view whenever the open hero moves — including the moves the app makes for the user.
function followMarkedHero() {
  const index = rosterOrder.value.findIndex(
    (rosterHero) => rosterHero.id === props.heroId
  );

  if (index < 0) {
    return;
  }

  followTile(rosterRail.value, railTiles.value?.[index]);
  followTile(rosterRibbon.value, ribbonTiles.value?.[index]);
}

function followTile(strip: RosterStrip | null, tile: HTMLElement | undefined) {
  if (!strip || !tile) {
    return;
  }

  strip.bringIntoView(tile);
}

// ! Deferred a frame past the DOM patch: on open the dialog is still laying out, and feature 013 reads a
// ! not-yet-laid-out region as zeroes — harmless, but it would leave the tile where it was.
watch(
  () => props.heroId,
  () => {
    requestAnimationFrame(followMarkedHero);
  },
  { flush: 'post' }
);

// ! Opening is itself a trigger, and a watcher only fires on a change — so a dialog mounted with a hero
// ! already set needs this. It belongs in a lifecycle hook rather than an `immediate` watcher because
// ! `/` is prerendered: an immediate callback runs in setup, on the server, where there is no rAF.
onMounted(() => {
  requestAnimationFrame(followMarkedHero);
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

const {
  hero,
  statBonuses,
  levelUpPointsUsed,
  bonusLevel,
  pointsRemaining,
  bonusFull,
  canLevelUp,
  heroLevel,
  flightActive,
  flightInfo,
  flightShown,
  flightLocked,
  hasPowers,
  resolvedStat
} = useHeroDerived(() => props.heroId);

const { note: heroNote, advisories: heroAdvisories } = useHeroNotes(
  () => props.heroId
);

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

const displayPowers = computed(() => powers.value ?? []);

const specialPowerStateValue = computed(() => {
  if (!props.heroId) {
    return 0;
  }
  return getSpecialPowerState(props.heroId);
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

function computedStat(stat: StatName): number {
  return props.heroId ? getEffectiveStats(props.heroId)[stat] : 0;
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

function handleTogglePower(power: HeroPowerDefinition) {
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
// * The pair's combined effective stats — the planner's shared pair computation, so this block and the synergy tab can never disagree (feature 014). Read-only: the dialog edits one hero.
const combinedStats = computed(() => {
  const partner = synergyPartner.value;

  if (!props.heroId || !partner) {
    return [];
  }

  const totals = getPairCombinedStats(props.heroId, partner.id);

  return STAT_NAMES.map((stat) => ({ stat, value: totals[stat] }));
});

// * The note only earns its line where a slot-filling power is actually in play — feature 012's deduction is invisible on every other pair.
// * Only while the power is actually contributing. The line explains a subtraction from the pair total, and with Spread Thin untrained there is no bonus to subtract from — the sentence would be describing arithmetic the reader cannot see, on the panel where the copy is tightest.
const pairFillsASlot = computed(() =>
  [props.heroId, synergyPartner.value?.id].some(
    (id) =>
      !!id &&
      SPECIAL_POWER_MECHANICS[id as keyof typeof SPECIAL_POWER_MECHANICS]
        ?.type === 'spread-thin' &&
      getSpecialPowerState(id) > 0
  )
);

const pairTotalBaseText = computed(() =>
  synergyPartner.value
    ? `${hero.value?.name} and ${synergyPartner.value.name} combined, with every bonus applied.`
    : ''
);

const PAIR_TOTAL_SPREAD_THIN_SUFFIX =
  " Spread Thin counts the partner's slot as filled.";

// * Both possible lengths, for the reserved-height grid in the template — see
// * descriptionVariants above for the same technique.
const pairTotalDescriptionVariants = computed(() => [
  pairTotalBaseText.value,
  pairTotalBaseText.value + PAIR_TOTAL_SPREAD_THIN_SUFFIX
]);

const pairTotalDescription = computed(() =>
  pairFillsASlot.value
    ? pairTotalDescriptionVariants.value[1]
    : pairTotalDescriptionVariants.value[0]
);

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
