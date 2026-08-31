<template>
  <section class="w-fit bg-default panel">
    <div class="flex plate items-center px-3">
      <h2 class="font-heading text-title uppercase">Requirements check</h2>
    </div>

    <div class="flex flex-col items-center gap-4 p-3">
      <div class="w-72 border-2 border-accented bg-default">
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
      <ul class="grid grid-cols-2 gap-x-10 gap-y-1">
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
        <!-- * A reserved slot: 0% to 100% renders in the same box, so the panel never
             breathes as the estimate moves — and the number tweens to its new value. -->
        <span
          class="min-w-24 border-2 border-accented bg-muted px-4 py-0.5 text-center font-heading text-2xl font-bold"
          :class="failed ? 'text-error-600' : ''"
        >
          {{ displayedEstimate }}%
        </span>
        <span class="font-heading text-base tracking-label text-dimmed uppercase">
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
const failed = computed(() => missionSuccess.value.failedStat !== null);

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
</script>
