<template>
  <!-- * w-27 is the chip box's own 108px (annex §13): below lg the portrait shrinks to exactly what four chips need. -->
  <div class="flex w-27 shrink-0 flex-col gap-2 lg:w-56">
    <HeroPortrait
      :hero-id="heroId"
      usage="synergy"
      :alt="hero.name"
      class="aspect-square w-full cursor-pointer border-2 border-accented bg-accented object-cover transition-shadow select-none hover:ring-2 hover:ring-warning"
      @click="$emit('viewDetail')"
    />

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

defineEmits<{
  viewDetail: [];
}>();

const { heroes } = useHeroPlanner();

const hero = computed(() =>
  (heroes.value ?? []).find((h) => h.id === props.heroId)!
);
</script>
