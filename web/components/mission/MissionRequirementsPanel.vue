<template>
  <section class="bg-default panel">
    <div class="flex plate items-center px-3">
      <h2 class="font-heading text-title uppercase">Requirements check</h2>
    </div>

    <div class="flex flex-col items-center gap-4 p-3">
      <!-- * `max-w-full` lets the design-width frame give up width instead of bleeding past the panel's padding. -->
      <div class="w-72 max-w-full border-2 border-accented bg-default">
        <div class="mx-auto aspect-square w-full">
          <StatRadar
            :axes="radarAxes"
            :reference="requiredValues"
            :fail-at="failValues"
            :xp-at="xpValues"
            :title="`Team totals against template #${missionActiveTemplate + 1}`"
          />
        </div>
      </div>

      <!-- * The legend always lists every series, so a threshold appearing changes the chart, not the layout. -->
      <ul class="grid grid-cols-2 gap-x-8 gap-y-2">
        <li
          v-for="series in LEGEND"
          :key="series.label"
          class="flex items-center gap-3 font-heading text-label text-toned uppercase"
        >
          <span :class="series.swatch" aria-hidden="true" />
          {{ series.label }}
        </li>
      </ul>

      <p class="flex items-center gap-3">
        <!-- * Fixed width, so the panel doesn't breathe as the estimate moves; the certain outcomes add a marker so colour is never the only signal. -->
        <span
          class="flex w-36 items-center justify-center gap-2 border-2 px-2 py-1 text-center font-heading text-2xl font-bold transition-colors duration-(--duration-baseline)"
          :class="outcomeClass"
        >
          <u-icon
            v-if="outcome !== null"
            :name="outcomeIcon"
            class="size-6 shrink-0 text-neutral-100"
            aria-hidden="true"
          />
          {{ displayedEstimate }}%
        </span>

        <span
          class="font-heading text-base tracking-label text-dimmed uppercase"
        >
          Est. success
        </span>
      </p>
    </div>
  </section>
</template>

<script setup lang="ts">
const LEGEND = [
  {
    label: 'Required',
    swatch: 'inline-block w-6 border-t-2 border-dashed border-accented'
  },
  { label: 'Your team', swatch: 'inline-block size-3 bg-primary' },
  {
    label: 'Fail at',
    swatch: 'inline-block size-3 rounded-full border border-accented bg-error'
  },
  {
    label: '2×XP at',
    swatch: 'inline-block size-3 rounded-full border border-accented bg-warning'
  }
];

const {
  missionActiveTemplate,
  missionActiveTemplateData,
  missionTeamTotals,
  missionSuccess
} = useHeroPlanner();

const radarAxes = computed(() =>
  RADAR_STAT_ORDER.map((stat) => ({
    key: stat,
    label: stat,
    icon: STAT_ICONS[stat],
    value: missionTeamTotals.value[stat]
  }))
);

const requiredValues = computed(() =>
  RADAR_STAT_ORDER.map((stat) => missionActiveTemplateData.value.req[stat])
);

const failValues = computed(() =>
  RADAR_STAT_ORDER.map(
    (stat) => missionActiveTemplateData.value.fail[stat] ?? 0
  )
);

const xpValues = computed(() =>
  RADAR_STAT_ORDER.map((stat) => missionActiveTemplateData.value.xp[stat] ?? 0)
);

// * The radar's own tween, so the number and the shape move together.
const displayedValues = useTweenedValues(
  computed(() => [missionSuccess.value.estimate * 100]),
  200
);

const displayedEstimate = computed(() =>
  Math.round(displayedValues.value[0] ?? 0)
);

// * Read from the settled estimate, not the tweened one.
const outcome = computed<'certain' | 'doomed' | null>(() => {
  const estimate = missionSuccess.value.estimate;

  if (estimate >= 1) {
    return 'certain';
  }

  return estimate <= 0 ? 'doomed' : null;
});

const outcomeIcon = computed(() =>
  outcome.value === 'certain' ? 'i-lucide-check-circle-2' : 'i-lucide-x-circle'
);

const outcomeClass = computed(() => {
  if (outcome.value === 'certain') {
    return 'border-success-500 bg-success-500 text-neutral-100';
  }

  if (outcome.value === 'doomed') {
    return 'border-error-600 bg-error-600 text-neutral-100';
  }

  return 'border-accented bg-muted';
});
</script>
