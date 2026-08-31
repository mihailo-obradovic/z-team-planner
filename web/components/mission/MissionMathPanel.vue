<template>
  <section class="w-fit bg-default panel">
    <div class="flex plate items-center px-3">
      <h2 class="font-heading text-title uppercase">The math</h2>
    </div>

    <div class="flex w-96 flex-col gap-3 p-3">
      <div class="flex flex-col gap-1">
        <ul class="flex flex-col gap-1">
          <li
            v-for="row in totalRows"
            :key="row.stat"
            class="flex items-center justify-between gap-6"
          >
            <span
              class="flex items-center gap-2 font-heading text-base tracking-label text-toned uppercase"
            >
              <u-icon :name="STAT_ICONS[row.stat]" class="size-4 shrink-0" />
              {{ row.stat }}
            </span>

            <span class="flex items-center gap-2">
              <!-- * `have/need`, in a fixed slot so two digits shift nothing. -->
              <span class="w-14 text-center font-heading text-lg">
                <b>{{ row.have }}</b
                ><span class="text-muted">/{{ row.need }}</span>
              </span>
              <u-icon
                :name="row.have >= row.need ? 'i-lucide-check' : 'i-lucide-x'"
                class="size-5 shrink-0"
                :class="
                  row.have >= row.need ? 'text-success-500' : 'text-error-600'
                "
              />
            </span>
          </li>
        </ul>
      </div>

      <!-- * Every row below renders always, with a dash when it has nothing to say — a
           threshold or power appearing changes a value, never the panel's height. -->
      <div class="flex flex-col gap-1">
        <h3 class="font-heading text-label text-dimmed uppercase">
          Success calculation
        </h3>

        <dl class="flex flex-col gap-1">
          <div class="flex h-8 items-center justify-between gap-6">
            <dt class="font-heading text-base tracking-label text-toned uppercase">Radar coverage</dt>
            <dd class="font-heading text-xl font-bold">
              {{ coveragePercent }}%
            </dd>
          </div>

          <div class="flex h-8 items-center justify-between gap-6">
            <dt class="font-heading text-base tracking-label text-toned uppercase">Synergy boost</dt>
            <dd class="flex items-center gap-2">
              <!-- * The 4-position switch (feature 015): one global level, +5% each, inert
                   without a pair on the team. -->
              <div class="flex gap-1" role="group" aria-label="Synergy level">
                <IconButton
                  v-for="level in SYNERGY_LEVELS"
                  :key="level"
                  :label="`Synergy level ${level}`"
                  :active="missionSynergyLevel === level"
                  :disabled="!missionTeamHasPair"
                  color="secondary"
                  @click="setMissionSynergyLevel(level)"
                >
                  {{ level }}
                </IconButton>
              </div>
              <span class="w-14 text-right font-heading text-xl font-bold">
                +{{ synergyPercent }}%
              </span>
            </dd>
          </div>

          <!-- * Same height as the switch row above, reserved even when empty. -->
          <div class="flex h-3 items-center justify-end">
            <span
              class="font-heading text-tag text-dimmed uppercase"
              :class="missionTeamHasPair ? 'invisible' : ''"
            >
              no synergy pair on the team
            </span>
          </div>

          <div class="pt-1">
            <h3 class="font-heading text-label text-dimmed uppercase">
              Special conditions
            </h3>
          </div>

          <div class="flex h-8 items-center justify-between gap-6">
            <dt class="font-heading text-base tracking-label text-toned uppercase">Reattempt</dt>
            <dd class="font-heading text-lg text-toned">
              {{ reattemptNote }}
            </dd>
          </div>

          <div class="flex h-8 items-center justify-between gap-6">
            <dt class="font-heading text-base tracking-label text-toned uppercase">Fail check</dt>
            <dd>
              <u-badge
                v-if="hasFailThresholds"
                :color="failed ? 'error' : 'success'"
                variant="outline"
                size="lg"
              >
                {{ failed ? `${success.failedStat} fail` : 'Safe' }}
              </u-badge>
              <span v-else class="font-heading text-base font-bold text-dimmed">
                —
              </span>
            </dd>
          </div>

          <div class="flex h-8 items-center justify-between gap-6">
            <dt class="font-heading text-base tracking-label text-toned uppercase">Double XP bonus</dt>
            <dd>
              <u-badge
                v-if="missionXpFulfilled !== null"
                :color="missionXpFulfilled ? 'warning' : 'neutral'"
                :variant="missionXpFulfilled ? 'solid' : 'outline'"
                size="lg"
              >
                {{ missionXpFulfilled ? 'Fulfilled' : 'Not fulfilled' }}
              </u-badge>
              <span v-else class="font-heading text-base font-bold text-dimmed">
                —
              </span>
            </dd>
          </div>
        </dl>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
// * Feature 015's right column: the estimate's provenance, row by row, from the planner's
// * missionSuccess — nothing here recomputes, and every row holds its place (see above).
import { STAT_NAMES } from '@/types/hero';
import { STAT_ICONS } from '@/utils/statIcons';

import type { SynergyLevel } from '@/types/hero';

const SYNERGY_LEVELS: SynergyLevel[] = [0, 1, 2, 3];

const REATTEMPT_NAMES = { coupe: 'Pirouette', sonar: 'Talk Shit' } as const;

const {
  missionActiveTemplateData,
  missionTeamTotals,
  missionTeamHasPair,
  missionSynergyLevel,
  missionSuccess,
  missionXpFulfilled,
  setMissionSynergyLevel
} = useHeroPlanner();

const success = computed(() => missionSuccess.value);
const failed = computed(() => success.value.failedStat !== null);

const totalRows = computed(() =>
  STAT_NAMES.map((stat) => ({
    stat,
    need: missionActiveTemplateData.value?.req[stat] ?? 0,
    have: missionTeamTotals.value[stat]
  }))
);

const hasFailThresholds = computed(
  () => Object.keys(missionActiveTemplateData.value?.fail ?? {}).length > 0
);

const reattemptNote = computed(() => {
  const names = success.value.reattempters.map(
    (hero) => REATTEMPT_NAMES[hero as keyof typeof REATTEMPT_NAMES] ?? hero
  );

  return names.length ? `${names.join(' + ')} — retries on a fail` : '—';
});

const coveragePercent = computed(() =>
  Math.round(success.value.coverage * 100)
);
const synergyPercent = computed(() =>
  Math.round(success.value.synergyBonus * 100)
);
</script>
