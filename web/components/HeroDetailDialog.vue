<template>
  <u-modal :open="!!heroId" fullscreen @update:open="emit('close')">
    <!-- * The thumbnail names the hero below `lg`, where the large portrait is not drawn. -->
    <!-- * The roster rail and the radar stay outside the keyed fade: the rail is stable and the radar has its own tween. -->
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

        <!-- * Old and new names overlap in one clipped grid cell; the direction classes come from where the two heroes sit in the visible strip. -->
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
        <!-- * Every tile is bordered, so the open hero differs by colour without nudging its neighbours. -->
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

          <!-- * Viewport breakpoints, not container queries: the dialog is fullscreen, so both would measure the same width. -->
          <!-- ! The first two rows have fixed heights, or switching to a hero without steppers or a partner resizes the dialog. -->
          <!-- ! `grid-cols-[minmax(0,1fr)]` fixes the iOS sideways scroll: an implicit `auto` column is floored by its widest item's min-content, and each item's `min-w-0` removes the matching floor. -->
          <div
            class="grid grid-cols-[minmax(0,1fr)] gap-4 md:grid-cols-[17rem_minmax(0,1fr)] md:grid-rows-[18rem_18rem] lg:min-h-0 lg:flex-1 lg:grid-cols-[17rem_24rem_minmax(0,1fr)] lg:grid-rows-[18rem_18rem_minmax(0,1fr)]"
          >
            <!-- * Stretched, not square, so the portrait, the radar and the spanning columns end on the same line. -->
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

            <!-- ! Capped from `sm`, or the fullscreen square frame is viewport-wide until `md` gives it a column of its own. -->
            <!-- ! `w-full` under the cap sizes this and the grid centres it: `mx-auto` would drop it out of stretch and size the `viewBox` SVG to 300px, so the cap never binds. -->
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

// * Structural, so the dialog needn't import an auto-imported component for its type.
type RosterStrip = { bringIntoView: (target: HTMLElement) => void };

const props = defineProps<{
  heroId: HeroId | null;
}>();

const emit = defineEmits<{
  close: [];
  select: [heroId: HeroId];
}>();

// * Both rails are mounted at every width; the hidden one measures zero and no-ops.
const rosterRail = useTemplateRef<RosterStrip>('rosterRail');
const rosterRibbon = useTemplateRef<RosterStrip>('rosterRibbon');
const railTiles = useTemplateRef<HTMLElement[]>('railTile');
const ribbonTiles = useTemplateRef<HTMLElement[]>('ribbonTile');

const { synergyPairColumns, ep8Recruits, showEp8Recruits, getEffectiveStats } =
  useHeroPlanner();

const { hero } = useHeroDerived(() => props.heroId);
// * The overview grid's order, since the rail is a shortcut to those cards.
const rosterOrder = computed(() => {
  const paired = synergyPairColumns.value.flatMap((column) => [
    column.top,
    column.bottom
  ]);

  return showEp8Recruits.value ? [...paired, ...ep8Recruits.value] : paired;
});

// * Followed on click rather than through the watcher: clicking the open hero changes nothing to watch.
function handleRosterSelect(heroId: HeroId, event: MouseEvent) {
  const tile = event.currentTarget;

  if (tile instanceof HTMLElement) {
    rosterRail.value?.bringIntoView(tile);
    rosterRibbon.value?.bringIntoView(tile);
  }

  emit('select', heroId);
}

// * Follows every change of the open hero, including ones the app makes.
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

// ! Deferred a frame: on open the dialog is still laying out and measures zeroes.
watch(
  () => props.heroId,
  () => {
    requestAnimationFrame(followMarkedHero);
  },
  { flush: 'post' }
);

// * Forward when the new hero sits later in the visible strip, read from the rail's tiles, which have no rect while the rail is hidden. Set before the DOM patches so the classes are in place when the transition starts.
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

// ! A hook, not an `immediate` watcher: `/` is prerendered and the server has no rAF.
onMounted(() => {
  requestAnimationFrame(followMarkedHero);
});

// * Axis order starts at Combat, the apex, and runs clockwise, putting Intellect opposite Vigor and Charisma opposite Mobility.
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
