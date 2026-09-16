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
      <div
        v-for="{ slot, index, key } in teamSlots"
        :key="key"
        :data-team-slot="index"
        class="relative flex h-40 w-32 min-w-0 flex-col items-center gap-1 border-2 p-2 @max-[35rem]:h-auto @max-[35rem]:gap-0 @max-[35rem]:p-0.5"
        :class="
          slot === null ? 'border-dashed border-default' : 'border-accented'
        "
      >
        <!-- * Ineligible controls are disabled or invisible, never removed, so the row keeps its height. -->
        <!-- * Below 35rem each control sits on its own scrim, so a disabled arrow doesn't vanish against the art. -->
        <div class="flex h-6 w-full items-center gap-1 @max-[35rem]:contents">
          <span
            class="w-3 text-center font-heading text-label text-dimmed @max-[35rem]:absolute @max-[35rem]:top-0 @max-[35rem]:left-0 @max-[35rem]:z-10 @max-[35rem]:w-auto @max-[35rem]:bg-default/80 @max-[35rem]:px-1"
          >
            {{ index + 1 }}
          </span>

          <span class="flex-1 @max-[35rem]:hidden" />

          <template v-if="slot !== null">
            <template v-if="isHeroSlot(slot)">
              <IconButton
                icon="i-lucide-chevron-left"
                :label="`Move ${slotName(slot)} left`"
                :disabled="index === 0"
                data-move="-1"
                class="@max-[35rem]:absolute @max-[35rem]:bottom-0 @max-[35rem]:left-0 @max-[35rem]:z-10 @max-[35rem]:bg-default/85"
                @click="moveSlot(index, -1, $event)"
              />
              <IconButton
                icon="i-lucide-chevron-right"
                :label="`Move ${slotName(slot)} right`"
                :disabled="index === missionSlots.length - 1"
                data-move="1"
                class="@max-[35rem]:absolute @max-[35rem]:right-0 @max-[35rem]:bottom-0 @max-[35rem]:z-10 @max-[35rem]:bg-default/85"
                @click="moveSlot(index, 1, $event)"
              />
            </template>

            <IconButton
              icon="i-lucide-x"
              :label="`Remove ${slotName(slot)}`"
              :disabled="
                slot === GOLEM_COPY_SLOT &&
                !isRightmostCopy(missionSlots, index)
              "
              class="@max-[35rem]:absolute @max-[35rem]:top-0 @max-[35rem]:right-0 @max-[35rem]:z-10 @max-[35rem]:bg-default/85"
              @click="removeMissionSlot(index)"
            />
          </template>
        </div>

        <button
          v-if="slot !== null && slot !== GOLEM_COPY_SLOT"
          type="button"
          class="flex min-h-0 w-full flex-1 cursor-pointer flex-col items-center gap-2"
          :aria-label="`View ${slotName(slot)}`"
          @click="viewSlotDetail(slot)"
        >
          <HeroPortrait
            :hero-id="slotHeroId(slot)"
            usage="tile"
            :alt="slotName(slot)"
            class="size-22 border-2 border-accented bg-accented object-cover select-none @max-[35rem]:aspect-square @max-[35rem]:size-auto @max-[35rem]:w-full"
            :class="slot === ILLUSION_SLOT ? 'opacity-40' : ''"
          />

          <span
            class="w-full truncate text-center font-heading text-label uppercase @max-[35rem]:hidden"
          >
            {{ slotName(slot) }}
          </span>
        </button>

        <div
          v-else-if="slot === GOLEM_COPY_SLOT"
          class="flex min-h-0 w-full flex-1 flex-col items-center gap-2"
        >
          <HeroPortrait
            hero-id="golem"
            usage="tile"
            alt="Golem's copy"
            class="size-22 border-2 border-accented bg-accented object-cover opacity-40 select-none @max-[35rem]:aspect-square @max-[35rem]:size-auto @max-[35rem]:w-full"
          />

          <span
            class="w-full text-center font-heading text-tag text-dimmed uppercase @max-[35rem]:hidden"
          >
            Copy — +25%
          </span>

          <u-icon
            name="i-lucide-copy"
            title="Copy — +25%"
            class="hidden size-4 @max-[35rem]:absolute @max-[35rem]:bottom-0 @max-[35rem]:left-0 @max-[35rem]:z-10 @max-[35rem]:block @max-[35rem]:bg-default/80"
          />
        </div>

        <button
          v-else
          type="button"
          class="flex min-h-0 w-full flex-1 cursor-pointer flex-col items-center justify-center gap-2 font-heading text-label text-dimmed uppercase hover:text-highlighted @max-[35rem]:aspect-square"
          :aria-label="`Add hero to slot ${index + 1}`"
          @click="openPicker(index)"
        >
          <u-icon name="i-lucide-plus" class="size-6" />
          <span class="@max-[35rem]:hidden">Add hero</span>
        </button>
      </div>
    </TransitionGroup>

    <u-modal v-model:open="pickerOpen" title="Pick a hero">
      <template #body>
        <div v-if="missionCandidates.length" class="grid grid-cols-3 gap-3">
          <button
            v-for="hero in missionCandidates"
            :key="hero.id"
            type="button"
            class="flex cursor-pointer flex-col items-center gap-2 border-2 border-default p-2 hover:border-accented"
            @click="pick(hero.id)"
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
import HeroPortrait from '@/components/HeroPortrait.vue';

import { GOLEM_COPY_SLOT, ILLUSION_SLOT } from '@/types/mission';

import { isHeroSlot, isRightmostCopy } from '@/utils/missionTeam';

import type { HeroId } from '@/types/hero';
import type { MissionSlot } from '@/types/mission';

const emit = defineEmits<{
  viewDetail: [heroId: HeroId];
}>();

const {
  heroes,
  missionSlots,
  missionCandidates,
  missionIllusionRatio,
  missionIllusionSource,
  fillMissionSlot,
  removeMissionSlot,
  moveMissionSlot
} = useHeroPlanner();

const pickerOpen = ref(false);
const pickerSlot = ref<number | null>(null);

// * Heroes are keyed by id so a swap travels; other occupants are keyed by position and change in place.
const teamSlots = computed(() =>
  missionSlots.value.map((slot, index) => ({
    slot,
    index,
    key: isHeroSlot(slot) ? `hero:${slot}` : `at:${index}`
  }))
);

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

// * Focus stays with the moved card: if the pressed arrow ends up disabled, the card's other arrow takes it.
async function moveSlot(index: number, direction: -1 | 1, event: MouseEvent) {
  // ! `data-team-slot`, not `data-slot`: Nuxt UI puts its own `data-slot` on the button.
  const card = (event.currentTarget as HTMLElement).closest('[data-team-slot]');

  moveMissionSlot(index, direction);

  await nextTick();

  const arrow =
    card?.querySelector<HTMLElement>(
      `[data-move="${direction}"]:not([disabled])`
    ) ?? card?.querySelector<HTMLElement>('[data-move]:not([disabled])');

  arrow?.focus();
}

function viewSlotDetail(slot: Exclude<MissionSlot, null>) {
  const id = isHeroSlot(slot) ? slot : missionIllusionSource.value;

  if (id) {
    emit('viewDetail', id);
  }
}

function heroName(id: HeroId): string {
  return heroes.value.find((hero) => hero.id === id)?.name ?? id;
}

function slotName(slot: Exclude<MissionSlot, null>): string {
  if (slot === GOLEM_COPY_SLOT) {
    return "Golem's copy";
  }

  if (slot !== ILLUSION_SLOT) {
    return heroName(slot);
  }

  const source = missionIllusionSource.value;

  return source ? `Illusion of ${heroName(source)}` : 'Illusion';
}

// * Before a source exists, the illusion wears Prism's face.
function slotHeroId(slot: Exclude<MissionSlot, null>): HeroId {
  const id = isHeroSlot(slot) ? slot : missionIllusionSource.value;

  return id ?? 'prism';
}
</script>
