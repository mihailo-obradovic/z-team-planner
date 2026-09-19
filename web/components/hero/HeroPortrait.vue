<template>
  <!-- * The width sits on the element, not in a preset: @nuxt/image 2.0.0 builds the x1/x2 srcset from the element's own width. -->
  <!-- * `format` only matters in dev, where IPX would otherwise serve the softer WebP master instead of the AVIF production negotiates. -->
  <NuxtImg
    :src="src"
    :width="PORTRAIT_WIDTHS[usage]"
    :loading="PORTRAIT_LOADING[usage]"
    densities="x1 x2"
    format="avif"
    :alt="alt"
  />
</template>

<script setup lang="ts">
import { PORTRAIT_LOADING, PORTRAIT_WIDTHS } from '@/config/portraits';

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
