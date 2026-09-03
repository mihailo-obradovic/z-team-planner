<template>
  <section class="h-fit bg-default panel">
    <div class="flex plate items-center px-3">
      <h2 class="font-heading text-title uppercase">Your team</h2>
    </div>

    <!-- * The bottom row: four positional slots side by side — controls on top, avatar in
         the middle, label at the bottom — so filling, clearing or moving a hero reflows
         nothing (feature 015). Keeping all four in one row at every tier (feature 016) is
         `min-w-0` and no `flex-wrap`, not a fluid width: the slots keep their design width
         as the flex basis and shrink out of it only once the row would not fit, so the
         widest tier measures exactly what it did before. -->
    <div class="flex justify-center gap-3 p-2 @max-[35rem]:gap-2">
      <div
        v-for="(slot, index) in missionSlots"
        :key="index"
        class="relative flex h-40 w-32 min-w-0 flex-col items-center gap-1 border-2 p-2 @max-[35rem]:h-auto @max-[35rem]:gap-0 @max-[35rem]:p-0.5"
        :class="
          slot === null ? 'border-dashed border-default' : 'border-accented'
        "
      >
        <!-- * The control row keeps its height in every state; ineligible controls are
             disabled or invisible, never missing. Below 35rem there is no room for a row
             above the portrait, so it becomes `contents` and its four children position
             themselves into the portrait's corners instead — the arrows sit at the bottom
             two, which a copy leaves free because it has none. Each carries its own scrim:
             the button variant alone does not separate a disabled control from the art
             behind it, and an arrow that reads as absent reads as a bug. -->
        <div class="flex h-6 w-full items-center gap-1 @max-[35rem]:contents">
          <span
            class="w-3 text-center font-heading text-label text-dimmed @max-[35rem]:absolute @max-[35rem]:top-0 @max-[35rem]:left-0 @max-[35rem]:z-10 @max-[35rem]:w-auto @max-[35rem]:bg-default/80 @max-[35rem]:px-1"
          >
            {{ index + 1 }}
          </span>

          <span class="flex-1 @max-[35rem]:hidden" />

          <template v-if="slot !== null">
            <template v-if="isHero(slot)">
              <IconButton
                icon="i-lucide-chevron-left"
                :label="`Move ${slotName(slot)} left`"
                :disabled="index === 0"
                class="@max-[35rem]:absolute @max-[35rem]:bottom-0 @max-[35rem]:left-0 @max-[35rem]:z-10 @max-[35rem]:bg-default/85"
                @click="moveMissionSlot(index, -1)"
              />
              <IconButton
                icon="i-lucide-chevron-right"
                :label="`Move ${slotName(slot)} right`"
                :disabled="index === missionSlots.length - 1"
                class="@max-[35rem]:absolute @max-[35rem]:right-0 @max-[35rem]:bottom-0 @max-[35rem]:z-10 @max-[35rem]:bg-default/85"
                @click="moveMissionSlot(index, 1)"
              />
            </template>

            <!-- * Copies dissolve right-to-left: only the outermost one offers its X. -->
            <IconButton
              icon="i-lucide-x"
              :label="`Remove ${slotName(slot)}`"
              :disabled="slot === GOLEM_COPY_SLOT && !isRemovableCopy(index)"
              class="@max-[35rem]:absolute @max-[35rem]:top-0 @max-[35rem]:right-0 @max-[35rem]:z-10 @max-[35rem]:bg-default/85"
              @click="removeMissionSlot(index)"
            />
          </template>
        </div>

        <!-- * A filled slot opens the hero's detail dialog (the illusion opens its
             source's) — replacing a hero is remove-then-add (feature 015). -->
        <button
          v-if="slot !== null && slot !== GOLEM_COPY_SLOT"
          type="button"
          class="flex min-h-0 w-full flex-1 cursor-pointer flex-col items-center gap-2"
          :aria-label="`View ${slotName(slot)}`"
          @click="viewSlotDetail(slot)"
        >
          <NuxtImg
            :src="slotPortrait(slot)"
            :alt="slotName(slot)"
            class="size-22 border-2 border-accented bg-accented object-cover @max-[35rem]:aspect-square @max-[35rem]:size-auto @max-[35rem]:w-full"
            :class="slot === ILLUSION_SLOT ? 'opacity-40' : ''"
          />

          <span
            class="w-full truncate text-center font-heading text-label uppercase @max-[35rem]:hidden"
          >
            {{ slotName(slot) }}
          </span>
        </button>

        <!-- * A copy is not a control surface: it dissolves via its X, nothing else. -->
        <div
          v-else-if="slot === GOLEM_COPY_SLOT"
          class="flex min-h-0 w-full flex-1 flex-col items-center gap-2"
        >
          <NuxtImg
            :src="heroPortraitSrc('golem', sonarForm)"
            alt="Golem's copy"
            class="size-22 border-2 border-accented bg-accented object-cover opacity-40 @max-[35rem]:aspect-square @max-[35rem]:size-auto @max-[35rem]:w-full"
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
    </div>

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
            <NuxtImg
              :src="heroPortraitSrc(hero.id, sonarForm)"
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
// * Feature 015's team row: four positional slots. All state changes go through the
// * guarded planner actions; the picker offers only the current roster minus the team.
import { GOLEM_COPY_SLOT, ILLUSION_SLOT } from '@/types/mission';

import type { HeroId } from '@/types/hero';
import type { MissionSlot } from '@/types/mission';

const {
  heroes,
  monsterForm,
  missionSlots,
  missionCandidates,
  missionIllusionRatio,
  fillMissionSlot,
  removeMissionSlot,
  moveMissionSlot
} = useHeroPlanner();

const emit = defineEmits<{
  viewDetail: [heroId: HeroId];
}>();

const pickerOpen = ref(false);
const pickerSlot = ref<number | null>(null);

// * Three portraits in this panel follow Sonar's shared form (feature 012); the state converts here, once.
const sonarForm = computed(() => (monsterForm.value ? 'monster' : 'hybrid'));

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

function isHero(slot: Exclude<MissionSlot, null>): slot is HeroId {
  return slot !== ILLUSION_SLOT && slot !== GOLEM_COPY_SLOT;
}

function isRemovableCopy(index: number): boolean {
  return missionSlots.value.lastIndexOf(GOLEM_COPY_SLOT) === index;
}

function viewSlotDetail(slot: Exclude<MissionSlot, null>) {
  const id =
    slot === ILLUSION_SLOT ? illusionSource() : isHero(slot) ? slot : null;

  if (id) {
    emit('viewDetail', id);
  }
}

function heroName(id: HeroId): string {
  return (heroes.value ?? []).find((hero) => hero.id === id)?.name ?? id;
}

// * The illusion is named after its source — the hero to Prism's left.
function illusionSource(): HeroId | null {
  const prism = missionSlots.value.indexOf('prism');
  const source = prism > 0 ? missionSlots.value[prism - 1] : null;

  return source !== null && source !== ILLUSION_SLOT ? source : null;
}

function slotName(slot: Exclude<MissionSlot, null>): string {
  if (slot === GOLEM_COPY_SLOT) {
    return "Golem's copy";
  }

  if (slot !== ILLUSION_SLOT) {
    return heroName(slot);
  }

  const source = illusionSource();

  return source ? `Illusion of ${heroName(source)}` : 'Illusion';
}

function slotPortrait(slot: Exclude<MissionSlot, null>): string {
  const id = slot === ILLUSION_SLOT ? illusionSource() : slot;

  return heroPortraitSrc(id ?? 'prism', sonarForm.value);
}
</script>
