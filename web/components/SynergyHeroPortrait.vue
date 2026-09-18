<template>
  <!-- * w-27 is the chip box's 108px, the width four chips need. -->
  <div class="flex w-27 shrink-0 flex-col gap-2 lg:w-56">
    <button
      type="button"
      class="block w-full cursor-pointer"
      :aria-label="`View ${hero.name}`"
      @click="handleViewDetail"
    >
      <HeroPortrait
        :hero-id="heroId"
        usage="synergy"
        :alt="hero.name"
        class="aspect-square w-full border-2 border-accented bg-accented object-cover transition-shadow select-none hover:ring-2 hover:ring-warning"
      />
    </button>

    <HeroPowerChips :hero-id="heroId" />
  </div>
</template>

<script setup lang="ts">
import HeroPortrait from '@/components/HeroPortrait.vue';
import HeroPowerChips from '@/components/HeroPowerChips.vue';

import type { HeroId } from '@/types/hero';

const props = defineProps<{
  heroId: HeroId;
}>();

const emit = defineEmits<{
  viewDetail: [];
}>();

const { heroes } = useHeroPlanner();

const hero = computed(() =>
  heroes.value.find((candidate) => candidate.id === props.heroId)!
);

function handleViewDetail() {
  emit('viewDetail');
}
</script>
