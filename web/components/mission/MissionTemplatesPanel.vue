<template>
  <section class="w-fit bg-default panel">
    <div class="flex plate items-center px-3">
      <h2 class="font-heading text-title uppercase">Mission templates</h2>
    </div>

    <div class="flex flex-col gap-2 p-3">
      <!-- * Exactly one template is expanded — the active one; the others collapse to their
           REQ summary. The collapse state changes only with the selection. -->
      <!-- * The whole card selects — the header button stays as the accessible control;
           a bubbled click from a stepper only re-selects the already-active card. -->
      <section
        v-for="(template, index) in templates"
        :key="index"
        class="cursor-pointer border-2 border-accented"
        :class="index === activeIndex ? 'bg-muted' : 'bg-default'"
        @click="setMissionActiveTemplate(index)"
      >
        <button
          type="button"
          class="flex w-full cursor-pointer items-center gap-2 px-3 py-1"
          :aria-pressed="index === activeIndex"
          @click="setMissionActiveTemplate(index)"
        >
          <u-icon
            :name="
              index === activeIndex ? 'i-lucide-circle-dot' : 'i-lucide-circle'
            "
            class="size-4 shrink-0"
            :class="index === activeIndex ? 'text-warning-500' : 'text-dimmed'"
          />
          <span
            class="font-heading text-base font-bold tracking-label uppercase"
          >
            Template #{{ index + 1 }}
          </span>
        </button>

        <!-- * Both bodies stay mounted, each in a `0fr`/`1fr` grid row: switching the
             selection animates the card's height instead of snapping it. Size animation,
             so it short-circuits under reduced motion (annex §11). -->
        <!-- ! `inert` on the collapsed half: both bodies stay mounted for the height
             transition, and without it the hidden one keeps its controls focusable and in
             the accessibility tree. -->
        <div
          class="grid transition-[grid-template-rows] duration-250 ease-in-out motion-reduce:transition-none"
          :class="index === activeIndex ? 'grid-rows-[0fr]' : 'grid-rows-[1fr]'"
          :inert="index === activeIndex"
        >
          <div class="min-h-0 overflow-hidden">
            <!-- * Collapsed: one badge per stat, so the five REQs read as separate fields
             rather than one run of numbers. -->
            <ul class="flex flex-wrap gap-2 border-t border-muted px-3 py-2">
              <li
                v-for="stat in STAT_NAMES"
                :key="stat"
                class="flex items-center gap-1 border border-accented bg-default px-2 py-0.5 text-toned"
              >
                <u-icon :name="STAT_ICONS[stat]" class="size-4 shrink-0" />
                <span class="font-heading text-base font-bold">
                  {{ template.req[stat] }}
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div
          class="grid transition-[grid-template-rows] duration-250 ease-in-out motion-reduce:transition-none"
          :class="index === activeIndex ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'"
          :inert="index !== activeIndex"
        >
          <div class="min-h-0 overflow-hidden">
            <div
              class="grid grid-cols-[1fr_auto_auto_auto] items-center gap-x-4 gap-y-1 border-t border-muted px-3 py-2"
            >
              <span class="font-heading text-tag text-dimmed uppercase"
                >Stat</span
              >
              <span
                class="text-center font-heading text-tag text-dimmed uppercase"
              >
                REQ
              </span>
              <span
                class="text-center font-heading text-tag text-dimmed uppercase"
              >
                2×XP ≥
              </span>
              <span
                class="text-center font-heading text-tag text-dimmed uppercase"
              >
                Fail ≥
              </span>

              <template v-for="stat in STAT_NAMES" :key="stat">
                <span
                  class="flex items-center gap-2 font-heading text-base tracking-label text-toned uppercase"
                >
                  <u-icon :name="STAT_ICONS[stat]" class="size-4 shrink-0" />
                  {{ stat }}
                </span>

                <MissionValueStepper
                  :value="template.req[stat]"
                  :label="`template ${index + 1} required ${stat}`"
                  @change="setMissionReq(index, stat, $event ?? 0)"
                />

                <MissionValueStepper
                  :value="template.xp[stat] ?? null"
                  :label="`template ${index + 1} double XP threshold for ${stat}`"
                  unsettable
                  @change="setMissionThreshold(index, 'xp', stat, $event)"
                />

                <MissionValueStepper
                  :value="template.fail[stat] ?? null"
                  :label="`template ${index + 1} fail threshold for ${stat}`"
                  unsettable
                  @change="setMissionThreshold(index, 'fail', stat, $event)"
                />
              </template>
            </div>
          </div>
        </div>
      </section>
    </div>
  </section>
</template>

<script setup lang="ts">
// * Feature 015: three fixed templates, no add or delete, no names; both condition columns
// * configurable on any template. Every write goes through the guarded planner setters.
import MissionValueStepper from '@/components/mission/MissionValueStepper.vue';

import { STAT_NAMES } from '@/types/hero';
import { STAT_ICONS } from '@/utils/statIcons';

const {
  missionTemplates,
  missionActiveTemplate,
  setMissionActiveTemplate,
  setMissionReq,
  setMissionThreshold
} = useHeroPlanner();

const templates = computed(() => missionTemplates.value ?? []);
const activeIndex = computed(() => missionActiveTemplate.value);
</script>
