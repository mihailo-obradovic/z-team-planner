<template>
  <div class="flex min-w-0 flex-col border-2 border-accented bg-default">
    <!-- ! Comments stay inside the root, so the grid placement the dialog passes falls through. -->
    <div class="flex plate shrink-0 items-center px-4">
      <span class="font-heading tracking-label text-toned uppercase">
        Notes
      </span>
    </div>

    <!-- * `notes-leaving` takes a clearing line out of flow so the lines below travel under `notes-move`; `relative` is what it is positioned against. -->
    <ScrollRegion class="grid p-4 lg:min-h-0 lg:flex-1">
      <Transition name="slide">
        <TransitionGroup
          :key="heroId"
          tag="ul"
          name="slide"
          move-class="notes-move"
          enter-active-class="notes-entering"
          leave-active-class="notes-leaving"
          aria-label="Notes"
          @beforeLeave="pinLeaving"
          class="relative col-start-1 row-start-1 flex list-inside list-disc flex-col gap-2 self-start text-base marker:text-muted"
        >
          <li v-if="heroNote" key="note" class="text-muted">
            {{ heroNote }}
          </li>
          <li
            v-for="advisory in heroAdvisories"
            :key="advisory.id"
            class="text-muted"
          >
            {{ advisory.text }}
          </li>
        </TransitionGroup>
      </Transition>
    </ScrollRegion>
  </div>
</template>

<script setup lang="ts">
import { pinLeaving } from '@/utils/pinLeaving';

import type { HeroId } from '@/types/hero';

const props = defineProps<{
  heroId: HeroId;
}>();

const { note: heroNote, advisories: heroAdvisories } = useHeroNotes(
  () => props.heroId
);
</script>
