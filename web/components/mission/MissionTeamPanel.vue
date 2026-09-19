<template>
  <section class="h-fit bg-default panel">
    <div class="flex plate items-center px-3">
      <h2 class="font-heading text-title uppercase">Your team</h2>
    </div>

    <!-- * `min-w-0` without `flex-wrap` keeps the four slots in one row, shrinking only when they don't fit. -->
    <TransitionGroup
      tag="div"
      name="mission-slot"
      class="flex justify-center gap-3 p-2 @max-[35rem]:gap-2"
    >
      <MissionTeamSlot
        v-for="{ slot, index, key } in teamSlots"
        :key="key"
        :slot="slot"
        :index="index"
        :count="missionSlots.length"
        :removable="isRemovable(slot, index)"
        @move="(direction) => moveMissionSlot(index, direction)"
        @remove="() => removeMissionSlot(index)"
        @view="handleView"
        @add="() => openPicker(index)"
      />
    </TransitionGroup>

    <u-modal
      v-model:open="pickerOpen"
      title="Pick a hero"
      description="Choose the hero for this mission slot."
    >
      <template #body>
        <div v-if="missionCandidates.length" class="grid grid-cols-3 gap-3">
          <button
            v-for="hero in missionCandidates"
            :key="hero.id"
            type="button"
            class="flex cursor-pointer flex-col items-center gap-2 border-2 border-default p-2 hover:border-accented"
            @click="() => pick(hero.id)"
          >
            <HeroPortrait
              :hero-id="hero.id"
              usage="tile"
              :alt="hero.name"
              class="aspect-square w-full border-2 border-accented bg-accented object-cover"
            />

            <span class="font-heading text-label uppercase">
              {{ hero.name }}
            </span>
          </button>
        </div>

        <p v-else class="text-sm text-muted">
          Every hero on the roster is already on the team.
        </p>
      </template>
    </u-modal>
  </section>
</template>

<script setup lang="ts">
import HeroPortrait from '@/components/hero/HeroPortrait.vue';
import MissionTeamSlot from '@/components/mission/MissionTeamSlot.vue';

import { GOLEM_COPY_SLOT } from '@/types/mission';

import type { HeroId } from '@/types/hero';
import type { MissionSlot } from '@/types/mission';

const emit = defineEmits<{
  viewDetail: [heroId: HeroId];
}>();

const {
  missionSlots,
  missionCandidates,
  fillMissionSlot,
  removeMissionSlot,
  moveMissionSlot
} = useHeroPlanner();

const { pickerOpen, openPicker, pick } = usePicker();

function handleView(heroId: HeroId) {
  emit('viewDetail', heroId);
}

// ! Only the rightmost copy may go: removing one in the middle would renumber the copies under the pointer.
function isRemovable(slot: MissionSlot, index: number): boolean {
  return slot !== GOLEM_COPY_SLOT || isRightmostCopy(missionSlots.value, index);
}

// * Heroes are keyed by id so a swap travels; other occupants are keyed by position and change in place.
const teamSlots = computed(() =>
  missionSlots.value.map((slot, index) => ({
    slot,
    index,
    key: isHeroSlot(slot) ? `hero:${slot}` : `at:${index}`
  }))
);

function usePicker() {
  const pickerOpen = ref(false);
  const pickerSlot = ref<number | null>(null);

  function openPicker(index: number) {
    pickerSlot.value = index;
    pickerOpen.value = true;
  }

  function pick(heroId: HeroId) {
    if (pickerSlot.value !== null) {
      fillMissionSlot(pickerSlot.value, heroId);
    }

    pickerOpen.value = false;
    pickerSlot.value = null;
  }

  return { pickerOpen, openPicker, pick };
}
</script>
