<template>
  <!-- * The whole card selects, while the header button stays the accessible control. -->
  <section
    class="cursor-pointer border-2 border-accented"
    :class="active ? 'bg-muted' : 'bg-default'"
    @click="handleSelect"
  >
    <button
      type="button"
      class="flex w-full cursor-pointer items-center gap-2 px-3 py-1"
      :aria-pressed="active"
      @click="handleSelect"
    >
      <u-icon
        :name="selectionIcon"
        class="size-4 shrink-0"
        :class="active ? 'text-warning-500' : 'text-dimmed'"
      />

      <span class="font-heading text-base font-bold tracking-label uppercase">
        Template #{{ number }}
      </span>
    </button>

    <!-- * Both bodies stay mounted in `0fr`/`1fr` rows, so a selection animates the card's height. -->
    <!-- ! `inert` on the collapsed half, or its controls stay focusable and in the accessibility tree. -->
    <div
      class="grid transition-[grid-template-rows] duration-(--duration-slow) ease-in-out motion-reduce:transition-none"
      :class="active ? 'grid-rows-[0fr]' : 'grid-rows-[1fr]'"
      :inert="active"
    >
      <div class="min-h-0 overflow-hidden">
        <ul class="flex flex-wrap gap-2 border-t border-muted px-3 py-2">
          <li
            v-for="stat in STAT_NAMES"
            :key="stat"
            class="flex items-center gap-1 border border-accented bg-default px-2 py-1 text-toned"
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
      class="grid transition-[grid-template-rows] duration-(--duration-slow) ease-in-out motion-reduce:transition-none"
      :class="active ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'"
      :inert="!active"
    >
      <div class="min-h-0 overflow-hidden">
        <div
          class="hidden gap-1 border-t border-muted px-3 pt-2 @max-[28.5rem]:flex"
          role="group"
          aria-label="Template columns"
        >
          <u-button
            v-for="option in COLUMN_VIEWS"
            :key="option.value"
            size="xs"
            variant="subtle"
            color="secondary"
            :active="columnView === option.value"
            :aria-pressed="columnView === option.value"
            @click="() => handleColumnView(option.value)"
          >
            {{ option.label }}
          </u-button>
        </div>

        <div
          class="grid grid-cols-[1fr_auto_auto_auto] items-center gap-x-4 gap-y-1 border-t border-muted px-3 py-2 @max-[28.5rem]:gap-x-2"
          :class="statGridClass"
        >
          <span class="font-heading text-tag text-dimmed uppercase">Stat</span>

          <span
            class="text-center font-heading text-tag text-dimmed uppercase"
            :class="reqColumnClass"
          >
            REQ
          </span>

          <span
            class="text-center font-heading text-tag text-dimmed uppercase"
            :class="conditionColumnClass"
          >
            2×XP ≥
          </span>

          <span
            class="text-center font-heading text-tag text-dimmed uppercase"
            :class="conditionColumnClass"
          >
            Fail ≥
          </span>

          <template v-for="stat in STAT_NAMES" :key="stat">
            <!-- * The label steps down a size rather than leaving, so the wordmark survives an iPhone SE. -->
            <span
              class="flex items-center gap-2 font-heading text-base tracking-label text-toned uppercase @max-[28.5rem]:gap-1 @max-[28.5rem]:text-sm"
            >
              <u-icon
                :name="STAT_ICONS[stat]"
                class="size-4 shrink-0 @max-[28.5rem]:size-3.5"
              />

              <span :class="wordmarkClass">{{ stat }}</span>
            </span>

            <MissionValueStepper
              :value="template.req[stat]"
              :label="`template ${number} required ${stat}`"
              :class="reqColumnClass"
              @change="(value) => handleReqChange(stat, value)"
            />

            <MissionValueStepper
              :value="template.xp[stat] ?? null"
              :label="`template ${number} double XP threshold for ${stat}`"
              unsettable
              :class="conditionColumnClass"
              @change="(value) => handleXpChange(stat, value)"
            />

            <MissionValueStepper
              :value="template.fail[stat] ?? null"
              :label="`template ${number} fail threshold for ${stat}`"
              unsettable
              :class="conditionColumnClass"
              @change="(value) => handleFailChange(stat, value)"
            />
          </template>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import MissionValueStepper from '@/components/mission/MissionValueStepper.vue';

import { STAT_NAMES } from '@/types/hero';

import type { StatName } from '@/types/hero';
import type { MissionTemplate } from '@/types/mission';

const COLUMN_VIEWS = [
  { value: 'req', label: 'Requirements' },
  { value: 'conditions', label: 'Conditions' }
] as const;

type ColumnView = (typeof COLUMN_VIEWS)[number]['value'];

const props = defineProps<{
  template: MissionTemplate;
  index: number;
  active: boolean;
}>();

// * Shared by every card, since the toggle sits inside whichever one is open.
const columnView = defineModel<ColumnView>('columnView', { required: true });

const emit = defineEmits<{
  select: [];
}>();

const { setMissionReq, setMissionThreshold } = useHeroPlanner();

// * The player counts templates from one; the planner indexes them from zero.
const number = computed(() => props.index + 1);

const selectionIcon = computed(() =>
  props.active ? 'i-lucide-circle-dot' : 'i-lucide-circle'
);

// * Below the tight tier the hidden column's track goes with it, or the row keeps a gap where nothing renders.
const statGridClass = computed(() =>
  columnView.value === 'req'
    ? '@max-[28.5rem]:grid-cols-[1fr_auto]'
    : '@max-[28.5rem]:grid-cols-[1fr_auto_auto]'
);

const reqColumnClass = computed(() =>
  columnView.value === 'req' ? '' : '@max-[28.5rem]:hidden'
);

const conditionColumnClass = computed(() =>
  columnView.value === 'conditions' ? '' : '@max-[28.5rem]:hidden'
);

const wordmarkClass = computed(() =>
  columnView.value === 'conditions' ? '@max-[20rem]:hidden' : ''
);

function handleSelect() {
  emit('select');
}

function handleColumnView(value: ColumnView) {
  columnView.value = value;
}

// * A requirement has no unset state, so clearing the stepper means zero.
function handleReqChange(stat: StatName, value: number | null) {
  setMissionReq(props.index, stat, value ?? 0);
}

function handleXpChange(stat: StatName, value: number | null) {
  setMissionThreshold({ template: props.index, kind: 'xp', stat, value });
}

function handleFailChange(stat: StatName, value: number | null) {
  setMissionThreshold({ template: props.index, kind: 'fail', stat, value });
}
</script>
