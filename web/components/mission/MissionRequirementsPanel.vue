<template>
  <section class="bg-default panel">
    <div class="flex plate items-center px-3">
      <h2 class="font-heading text-title uppercase">Requirements check</h2>
    </div>

    <div class="flex flex-col items-center gap-4 p-3">
      <!-- * The frame is the panel's design width exactly, so it is the first thing to run
           out of room: `max-w-full` lets it give up width rather than bleed over the
           panel's padding and border (feature 016). Not tied to a threshold — it is a
           no-op at every width where the panel can still hold 288px. -->
      <div class="w-72 max-w-full border-2 border-accented bg-default">
        <div class="mx-auto aspect-square w-full">
          <StatRadar
            :axes="radarAxes"
            :reference="requiredValues"
            :fail-at="failValues"
            :xp-at="xpValues"
            :title="`Team totals against template #${activeIndex + 1}`"
          />
        </div>
      </div>

      <!-- * The legend carries every series and marker the chart can draw, always — a fixed
           block, so a threshold appearing changes the chart, never the layout (feature 015). -->
      <ul class="grid grid-cols-2 gap-x-10 gap-y-2">
        <li
          class="flex items-center gap-3 font-heading text-label text-toned uppercase"
        >
          <span
            class="inline-block w-6 border-t-2 border-dashed border-accented"
            aria-hidden="true"
          />
          Required
        </li>
        <li
          class="flex items-center gap-3 font-heading text-label text-toned uppercase"
        >
          <span class="inline-block size-3 bg-primary" aria-hidden="true" />
          Your team
        </li>
        <li
          class="flex items-center gap-3 font-heading text-label text-toned uppercase"
        >
          <span
            class="inline-block size-3 rounded-full border border-accented bg-error"
            aria-hidden="true"
          />
          Fail at
        </li>
        <li
          class="flex items-center gap-3 font-heading text-label text-toned uppercase"
        >
          <span
            class="inline-block size-3 rounded-full border border-accented bg-warning"
            aria-hidden="true"
          />
          2×XP at
        </li>
      </ul>

      <p class="flex items-center gap-3">
        <!-- * A fixed width, not a minimum: every value from 0% to 100% and both certainty
             markers render in the same box, so the panel never breathes as the estimate moves — and the number tweens to its new value. The
             two certain outcomes carry the state in the box itself, with a marker beside
             the number so colour is never the only signal (annex §14). -->
        <span
          class="flex w-36 items-center justify-center gap-2 border-2 px-2 py-0.5 text-center font-heading text-2xl font-bold transition-colors duration-150"
          :class="outcomeClass"
        >
          <u-icon
            v-if="outcome !== null"
            :name="
              outcome === 'certain'
                ? 'i-lucide-check-circle-2'
                : 'i-lucide-x-circle'
            "
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
// * Feature 015's middle column: the required-vs-team radar with its threshold markers and
// * the headline estimate. Numbers come from the planner's missionSuccess — no recomputing.
import { STAT_ICONS, RADAR_STAT_ORDER } from '@/utils/statIcons';

const {
  missionActiveTemplate,
  missionActiveTemplateData,
  missionTeamTotals,
  missionSuccess
} = useHeroPlanner();

const activeIndex = computed(() => missionActiveTemplate.value);

const radarAxes = computed(() =>
  RADAR_STAT_ORDER.map((stat) => ({
    key: stat,
    label: stat,
    icon: STAT_ICONS[stat],
    value: missionTeamTotals.value[stat]
  }))
);

const requiredValues = computed(() =>
  RADAR_STAT_ORDER.map(
    (stat) => missionActiveTemplateData.value?.req[stat] ?? 0
  )
);

const failValues = computed(() =>
  RADAR_STAT_ORDER.map(
    (stat) => missionActiveTemplateData.value?.fail[stat] ?? 0
  )
);

const xpValues = computed(() =>
  RADAR_STAT_ORDER.map((stat) => missionActiveTemplateData.value?.xp[stat] ?? 0)
);

// * The same rAF tween the radar uses, so the number and the shape move together.
const displayedValues = useTweenedValues(
  computed(() => [missionSuccess.value.estimate * 100]),
  200
);

const displayedEstimate = computed(() =>
  Math.round(displayedValues.value[0] ?? 0)
);

// * The two certainties, read from the settled estimate rather than the travelling one.
const outcome = computed<'certain' | 'doomed' | null>(() => {
  const estimate = missionSuccess.value.estimate;

  if (estimate >= 1) {
    return 'certain';
  }

  return estimate <= 0 ? 'doomed' : null;
});

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
