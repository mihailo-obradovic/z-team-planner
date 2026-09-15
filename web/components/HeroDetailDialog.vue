<template>
  <u-modal :open="!!heroId" fullscreen @update:open="emit('close')">
    <!-- * The thumbnail rides in the toolbar so the hero is named even below `lg`, where the large portrait is not drawn. -->
    <!-- * The thumbnail, the portrait and the powers panel are keyed by the hero and fade on a roster switch — annex §11 state fade (feature 024). The name and the notes slide instead (feature 025). The roster rail and the radar stay outside: the rail is stable and the radar keeps its own tween. -->
    <template #title>
      <span class="flex items-center gap-2">
        <Transition name="state-fade" mode="out-in">
          <HeroPortrait
            v-if="heroId"
            :key="heroId"
            :hero-id="heroId"
            usage="header"
            :alt="hero?.name ?? ''"
            class="size-6 shrink-0 object-cover object-top"
          />
        </Transition>

        <!-- * The name slides in the roster's own direction (feature 025): old and new overlap in one grid cell while the cell clips the half-line of travel, and the direction classes are set from where the two heroes sit in the strip on screen. The thumbnail beside it only fades, in its own slot, so one thing moves. -->
        <span class="grid overflow-hidden" :class="nameSlideClass">
          <Transition name="slide">
            <span :key="heroId ?? ''" class="col-start-1 row-start-1">
              {{ hero?.name }}
            </span>
          </Transition>
        </span>
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
              <Transition name="state-fade" mode="out-in">
                <div :key="hero.id" class="size-full">
                  <HeroPortrait
                    :hero-id="hero.id"
                    usage="panel"
                    :alt="hero.name"
                    class="size-full object-cover object-top"
                  />
                </div>
              </Transition>
            </div>

            <HeroStatsPanel
              :hero-id="hero.id"
              :longest-partner-name="longestHeroName"
              class="md:row-span-2 md:min-h-0 lg:row-span-2 lg:min-h-0"
              @select="emit('select', $event)"
            />

            <!-- ! Capped from `sm`, not left to the column. The frame is `aspect-square` at the column's full width, and the dialog is fullscreen, so between 640 and 1023 the radar was a square as wide as the viewport and pushed everything else off screen. From `md` it has a column of its own and fills it instead, which is why the cap and the centring are dropped there rather than at `lg`. -->
            <!-- ! `w-full` is load-bearing beside the cap, and `mx-auto` is not what centres this. Auto margins on a grid item drop it out of `stretch` and size it to its content — which for a `viewBox`-only SVG is the replaced-element default of 300px, so the frame measured 304 against a 320 cap that never bound. Width 100% capped by `max-w-80`, centred by the grid, is what actually holds. -->
            <div
              class="order-first aspect-square min-w-0 border-2 border-accented bg-default sm:w-full sm:max-w-80 sm:justify-self-center md:order-none md:aspect-auto md:min-h-0 md:max-w-none md:justify-self-auto lg:order-none lg:aspect-auto lg:min-h-0"
            >
              <StatRadar :axes="radarAxes" :title="`${hero.name} stats`" />
            </div>

            <HeroPowersPanel
              :hero-id="hero.id"
              class="md:col-span-2 lg:col-span-1 lg:col-start-3 lg:row-span-2 lg:row-start-1 lg:min-h-0"
            />

            <HeroNotesPanel
              :hero-id="hero.id"
              class="md:col-span-2 lg:col-span-3 lg:min-h-0"
            />
          </div>
        </ScrollRegion>
      </div>
    </template>
  </u-modal>
</template>

<script setup lang="ts">
import HeroPortrait from '@/components/HeroPortrait.vue';
import HeroStatsPanel from '@/components/HeroStatsPanel.vue';
import HeroPowersPanel from '@/components/HeroPowersPanel.vue';
import HeroNotesPanel from '@/components/HeroNotesPanel.vue';

import type { HeroId, StatName } from '@/types/hero';

// * Structural rather than the component's instance type, so the dialog does not import a component it renders by auto-import.
type RosterStrip = { bringIntoView: (target: HTMLElement) => void };

const props = defineProps<{
  heroId: HeroId | null;
}>();

const emit = defineEmits<{
  close: [];
  select: [heroId: HeroId];
}>();

// * Both rails are mounted at every width, so both are asked to follow and the hidden one measures zero and no-ops.
const rosterRail = useTemplateRef<RosterStrip>('rosterRail');
const rosterRibbon = useTemplateRef<RosterStrip>('rosterRibbon');
const railTiles = useTemplateRef<HTMLElement[]>('railTile');
const ribbonTiles = useTemplateRef<HTMLElement[]>('ribbonTile');

const { synergyPairColumns, ep8Recruits, showEp8Recruits, getEffectiveStats } =
  useHeroPlanner();

const { hero } = useHeroDerived(() => props.heroId);
// * The roster in the order the overview grid draws it — each synergy column top then bottom, then the episode 8 recruits when shown. The rail is a shortcut to those same cards, so it has to agree with them.
const rosterOrder = computed(() => {
  const paired = synergyPairColumns.value.flatMap((column) => [
    column.top,
    column.bottom
  ]);

  return showEp8Recruits.value ? [...paired, ...ep8Recruits.value] : paired;
});

// * Followed on the click itself, not through the watcher: clicking the open hero changes nothing to watch, and a half-clipped tile should still come whole (feature 019).
function handleRosterSelect(heroId: HeroId, event: MouseEvent) {
  const tile = event.currentTarget;

  if (tile instanceof HTMLElement) {
    rosterRail.value?.bringIntoView(tile);
    rosterRibbon.value?.bringIntoView(tile);
  }

  emit('select', heroId);
}

// * The marked tile is the dialog's only sign of where you are in the roster, so it follows every move of the open hero, the app's included.
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

// ! Deferred a frame past the DOM patch: on open the dialog is still laying out, and a region not yet laid out measures as zeroes.
watch(
  () => props.heroId,
  () => {
    requestAnimationFrame(followMarkedHero);
  },
  { flush: 'post' }
);

// * Which way the toolbar name slides (feature 025): forward when the new hero sits later in the roster than the one it replaces, and sideways when the ribbon rather than the rail is the strip on screen — read from the rail's own tiles, which measure no rect while the rail is `display: none`, so the name follows whichever strip the user sees rather than a breakpoint of its own. Set before the DOM patches, so the classes are on the wrapper when the transition starts. A switch mid-slide measures from the hero that was arriving, since that is the name the user saw; opening the dialog has nothing to measure from and leaves the classes as they were, with nothing on screen to slide.
const nameSlideClass = ref<string[]>([]);

watch(
  () => props.heroId,
  (heroId, previousHeroId) => {
    if (!heroId || !previousHeroId) {
      return;
    }

    const order = rosterOrder.value.map((rosterHero) => rosterHero.id);
    const backward = order.indexOf(heroId) < order.indexOf(previousHeroId);
    const sideways = railTiles.value?.[0]?.getClientRects().length === 0;

    nameSlideClass.value = [
      ...(backward ? ['slide-backward'] : []),
      ...(sideways ? ['slide-sideways'] : [])
    ];
  }
);

// ! A dialog mounted with a hero already set needs this, and a hook rather than an `immediate` watcher because `/` is prerendered and the server has no rAF.
onMounted(() => {
  requestAnimationFrame(followMarkedHero);
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

function computedStat(stat: StatName): number {
  return props.heroId ? getEffectiveStats(props.heroId)[stat] : 0;
}

const longestHeroName = computed(() =>
  rosterOrder.value.reduce(
    (longest: string, rosterHero) =>
      rosterHero.name.length > longest.length ? rosterHero.name : longest,
    ''
  )
);
</script>
