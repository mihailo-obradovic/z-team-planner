<template>
  <section class="bg-default panel">
    <div class="flex plate items-center px-3">
      <h2 class="font-heading text-title uppercase">The math</h2>
    </div>

    <!-- * `w-96` applies only at the widest tier, where the panel doesn't fill its row. -->
    <!-- * The two-column floor is in px: a 768px viewport leaves 726px of the tab's queried box once main has its scrollbar. -->
    <div
      class="grid w-96 gap-3 p-3 @max-[77rem]:w-auto @max-[77rem]:@min-[726px]:grid-cols-2 @max-[77rem]:@min-[726px]:items-start @max-[77rem]:@min-[726px]:gap-x-8"
    >
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
              <!-- * Fixed width, so two digits shift nothing. -->
              <span class="w-14 text-center font-heading text-lg">
                <b>{{ row.have }}</b
                ><span class="text-muted">/{{ row.need }}</span>
              </span>
              <u-icon
                :name="row.met ? 'i-lucide-check' : 'i-lucide-x'"
                class="size-5 shrink-0"
                :class="row.met ? 'text-success-500' : 'text-error-600'"
              />
            </span>
          </li>
        </ul>
      </div>

      <!-- * Every row always renders, a dash when empty, so the panel's height never changes. -->
      <div class="flex flex-col gap-1">
        <h3 class="font-heading text-label text-dimmed uppercase">
          Success calculation
        </h3>

        <dl class="flex flex-col gap-1">
          <div class="flex h-8 items-center justify-between gap-6">
            <dt
              class="font-heading text-base tracking-label text-toned uppercase"
            >
              Radar coverage
            </dt>
            <dd class="font-heading text-xl font-bold">
              {{ coveragePercent }}%
            </dd>
          </div>

          <div class="flex h-8 items-center justify-between gap-6">
            <dt
              class="font-heading text-base tracking-label text-toned uppercase"
            >
              Synergy level
            </dt>
            <dd class="flex items-center gap-2">
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

          <!-- * Reserved at the switch row's height even when empty. -->
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
            <dt
              class="font-heading text-base tracking-label text-toned uppercase"
            >
              Reattempt
            </dt>
            <dd class="font-heading text-lg text-toned">
              {{ reattemptNote }}
            </dd>
          </div>

          <div class="flex h-8 items-center justify-between gap-6">
            <dt
              class="font-heading text-base tracking-label text-toned uppercase"
            >
              Fail check
            </dt>
            <dd>
              <u-badge
                v-if="hasFailThresholds"
                :color="failed ? 'error' : 'success'"
                variant="outline"
                size="lg"
              >
                {{ failed ? `${missionSuccess.failedStat} fail` : 'Safe' }}
              </u-badge>
              <span v-else class="font-heading text-base font-bold text-dimmed">
                —
              </span>
            </dd>
          </div>

          <div class="flex h-8 items-center justify-between gap-6">
            <dt
              class="font-heading text-base tracking-label text-toned uppercase"
            >
              Double XP bonus
            </dt>
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

const failed = computed(() => missionSuccess.value.failedStat !== null);

const tweenTargets = computed(() => [
  ...STAT_NAMES.map((stat) => missionTeamTotals.value[stat]),
  ...STAT_NAMES.map((stat) => missionActiveTemplateData.value.req[stat]),
  missionSuccess.value.coverage * 100,
  missionSuccess.value.synergyBonus * 100
]);

const tweened = useTweenedValues(tweenTargets, 200);

const totalRows = computed(() =>
  STAT_NAMES.map((stat, index) => ({
    stat,
    need: Math.round(tweened.value[STAT_NAMES.length + index] ?? 0),
    have: Math.round(tweened.value[index] ?? 0),
    // * Settled values, not tweened ones, so the icon doesn't flicker.
    met:
      missionTeamTotals.value[stat] >= missionActiveTemplateData.value.req[stat]
  }))
);

const hasFailThresholds = computed(
  () => Object.keys(missionActiveTemplateData.value.fail).length > 0
);

const reattemptNote = computed(() => {
  const names = missionSuccess.value.reattempters.map(
    (hero) => REATTEMPT_NAMES[hero as keyof typeof REATTEMPT_NAMES] ?? hero
  );

  return names.length ? `${names.join(' + ')} — retries on a fail` : '—';
});

const coveragePercent = computed(() =>
  Math.round(tweened.value[STAT_NAMES.length * 2] ?? 0)
);

const synergyPercent = computed(() =>
  Math.round(tweened.value[STAT_NAMES.length * 2 + 1] ?? 0)
);
</script>
