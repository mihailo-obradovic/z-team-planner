<template>
  <!-- * w-27 is the chip box's own 108px (annex §13): below lg the portrait shrinks to exactly what four chips need. -->
  <div class="flex w-27 shrink-0 flex-col gap-2 lg:w-56">
    <NuxtImg
      :src="portraitSrc"
      :alt="hero.name"
      class="aspect-square w-full cursor-pointer border-2 border-accented bg-accented object-cover transition-shadow hover:ring-2 hover:ring-warning"
      @click="$emit('viewDetail')"
    />

    <HeroPowerChips :hero-id="heroId" />
  </div>
</template>

<script setup lang="ts">
import HeroPowerChips from '@/components/HeroPowerChips.vue';

import type { HeroId } from '@/types/hero';

const props = defineProps<{
  heroId: HeroId;
}>();

defineEmits<{
  viewDetail: [];
}>();

const { heroes, monsterForm } = useHeroPlanner();

const hero = computed(
  () => (heroes.value ?? []).find((h) => h.id === props.heroId)!
);

const portraitSrc = computed(() =>
  heroPortraitSrc(props.heroId, monsterForm.value ? 'monster' : 'hybrid')
);
</script>
