<template>
  <u-modal :open="!!heroId" fullscreen @update:open="handleClose">
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
        <HeroRosterStrip
          ref="rosterRail"
          variant="rail"
          :heroes="rosterOrder"
          :active-id="heroId"
          @select="handleSelect"
        />

        <ScrollRegion class="flex min-w-0 flex-1 flex-col gap-4">
          <HeroRosterStrip
            ref="rosterRibbon"
            variant="ribbon"
            :heroes="rosterOrder"
            :active-id="heroId"
            @select="handleSelect"
          />

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
              @select="handleSelect"
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
import HeroPortrait from '@/components/hero/HeroPortrait.vue';
import HeroRosterStrip from '@/components/hero/HeroRosterStrip.vue';
import HeroStatsPanel from '@/components/hero/HeroStatsPanel.vue';
import HeroPowersPanel from '@/components/hero/HeroPowersPanel.vue';
import HeroNotesPanel from '@/components/hero/HeroNotesPanel.vue';

import type { HeroId } from '@/types/hero';

const props = defineProps<{
  heroId: HeroId | null;
}>();

const emit = defineEmits<{
  close: [];
  select: [heroId: HeroId];
}>();

const rosterRail =
  useTemplateRef<InstanceType<typeof HeroRosterStrip>>('rosterRail');
const rosterRibbon =
  useTemplateRef<InstanceType<typeof HeroRosterStrip>>('rosterRibbon');

const { synergyPairColumns, ep8Recruits, showEp8Recruits, getEffectiveStats } =
  useHeroPlanner();

const { hero } = useHeroDerived(() => props.heroId);

const rosterOrder = computed(() => {
  const paired = synergyPairColumns.value.flatMap((column) => [
    column.top,
    column.bottom
  ]);

  return showEp8Recruits.value ? [...paired, ...ep8Recruits.value] : paired;
});

const radarAxes = computed(() =>
  RADAR_STAT_ORDER.map((stat) => ({
    key: stat,
    label: stat,
    icon: STAT_ICONS[stat],
    value: props.heroId ? getEffectiveStats(props.heroId)[stat] : 0
  }))
);

const longestHeroName = computed(() =>
  rosterOrder.value.reduce(
    (longest: string, rosterHero) =>
      rosterHero.name.length > longest.length ? rosterHero.name : longest,
    ''
  )
);
function handleClose() {
  emit('close');
}

function handleSelect(heroId: HeroId) {
  emit('select', heroId);
}

function followMarkedHero() {
  rosterRail.value?.follow();
  rosterRibbon.value?.follow();
}

// ! Deferred a frame: on open the dialog is still laying out and measures zeroes.
watch(
  () => props.heroId,
  () => {
    requestAnimationFrame(followMarkedHero);
  },
  { flush: 'post' }
);

// * Forward when the new hero sits later in the visible strip; sideways when the rail is the hidden one. Set before the DOM patches so the classes are in place when the transition starts.
const nameSlideClass = ref<string[]>([]);

watch(
  () => props.heroId,
  (heroId, previousHeroId) => {
    if (!heroId || !previousHeroId) {
      return;
    }

    const order = rosterOrder.value.map((rosterHero) => rosterHero.id);
    const backward = order.indexOf(heroId) < order.indexOf(previousHeroId);
    const sideways = rosterRail.value?.isDisplayed() === false;

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
</script>
