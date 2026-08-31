<template>
  <div class="flex w-56 shrink-0 flex-col gap-2">
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
  heroPortraitSrc(props.heroId, monsterForm.value)
);
</script>
