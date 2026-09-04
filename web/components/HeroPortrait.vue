<template>
  <!-- * The width sits on the element, not in a preset: on @nuxt/image 2.0.0 the x1/x2 srcset is built from the element's own width (feature 021). Class and listeners fall through to the image; the call site owns the look, this component owns the pixels. -->
  <NuxtImg
    :src="src"
    :width="PORTRAIT_WIDTHS[usage]"
    densities="x1 x2"
    :alt="alt"
  />
</template>

<script setup lang="ts">
import { PORTRAIT_WIDTHS } from '@/config/portraits';

import type { PortraitUsage } from '@/config/portraits';
import type { HeroId } from '@/types/hero';

const props = defineProps<{
  heroId: HeroId;
  usage: PortraitUsage;
  alt: string;
}>();

const { monsterForm } = useHeroPlanner();

const src = computed(() =>
  heroPortraitSrc(props.heroId, monsterForm.value ? 'monster' : 'hybrid')
);
</script>
