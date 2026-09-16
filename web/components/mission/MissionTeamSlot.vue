<template>
  <div
    ref="card"
    :data-team-slot="index"
    class="relative flex h-40 w-32 min-w-0 flex-col items-center gap-1 border-2 p-2 @max-[35rem]:h-auto @max-[35rem]:gap-0 @max-[35rem]:p-0.5"
    :class="slot === null ? 'border-dashed border-default' : 'border-accented'"
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
            :label="`Move ${name} left`"
            :disabled="index === 0"
            data-move="-1"
            class="@max-[35rem]:absolute @max-[35rem]:bottom-0 @max-[35rem]:left-0 @max-[35rem]:z-10 @max-[35rem]:bg-default/85"
            @click="handleMove(-1)"
          />
          <IconButton
            icon="i-lucide-chevron-right"
            :label="`Move ${name} right`"
            :disabled="index === count - 1"
            data-move="1"
            class="@max-[35rem]:absolute @max-[35rem]:right-0 @max-[35rem]:bottom-0 @max-[35rem]:z-10 @max-[35rem]:bg-default/85"
            @click="handleMove(1)"
          />
        </template>

        <IconButton
          icon="i-lucide-x"
          :label="`Remove ${name}`"
          :disabled="!removable"
          class="@max-[35rem]:absolute @max-[35rem]:top-0 @max-[35rem]:right-0 @max-[35rem]:z-10 @max-[35rem]:bg-default/85"
          @click="emit('remove')"
        />
      </template>
    </div>

    <button
      v-if="slot !== null && slot !== GOLEM_COPY_SLOT"
      type="button"
      class="flex min-h-0 w-full flex-1 cursor-pointer flex-col items-center gap-2"
      :aria-label="`View ${name}`"
      @click="handleView"
    >
      <HeroPortrait
        :hero-id="portraitHeroId"
        usage="tile"
        :alt="name"
        class="size-22 border-2 border-accented bg-accented object-cover select-none @max-[35rem]:aspect-square @max-[35rem]:size-auto @max-[35rem]:w-full"
        :class="slot === ILLUSION_SLOT ? 'opacity-40' : ''"
      />

      <span
        class="w-full truncate text-center font-heading text-label uppercase @max-[35rem]:hidden"
      >
        {{ name }}
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
      @click="emit('add')"
    >
      <u-icon name="i-lucide-plus" class="size-6" />
      <span class="@max-[35rem]:hidden">Add hero</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import HeroPortrait from '@/components/HeroPortrait.vue';

import { GOLEM_COPY_SLOT, ILLUSION_SLOT } from '@/types/mission';

import { isHeroSlot } from '@/utils/missionTeam';

import type { HeroId } from '@/types/hero';
import type { MissionSlot } from '@/types/mission';

const props = defineProps<{
  slot: MissionSlot;
  index: number;
  count: number;
  removable: boolean;
}>();

const emit = defineEmits<{
  move: [direction: -1 | 1];
  remove: [];
  view: [heroId: HeroId];
  add: [];
}>();

const card = useTemplateRef<HTMLElement>('card');

const { heroes, missionIllusionSource } = useHeroPlanner();

// * An illusion or a copy stands in for a hero; before a source exists, the illusion wears Prism's face.
const occupantHeroId = computed(() =>
  isHeroSlot(props.slot) ? props.slot : missionIllusionSource.value
);

const portraitHeroId = computed(() => occupantHeroId.value ?? 'prism');

const name = computed(() => {
  if (props.slot === GOLEM_COPY_SLOT) {
    return "Golem's copy";
  }

  if (props.slot !== ILLUSION_SLOT) {
    return heroName(props.slot);
  }

  const source = missionIllusionSource.value;

  return source ? `Illusion of ${heroName(source)}` : 'Illusion';
});

function heroName(id: HeroId | null): string {
  return heroes.value.find((hero) => hero.id === id)?.name ?? id ?? '';
}

// * Focus stays with the moved card: if the pressed arrow ends up disabled, the card's other arrow takes it.
async function handleMove(direction: -1 | 1) {
  emit('move', direction);

  await nextTick();

  const arrow =
    card.value?.querySelector<HTMLElement>(
      `[data-move="${direction}"]:not([disabled])`
    ) ?? card.value?.querySelector<HTMLElement>('[data-move]:not([disabled])');

  arrow?.focus();
}

function handleView() {
  if (occupantHeroId.value) {
    emit('view', occupantHeroId.value);
  }
}
</script>
