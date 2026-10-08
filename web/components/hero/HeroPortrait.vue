<template>
  <!-- * The span is the box: the call site's size, border, placeholder background and opacity land here through attribute fallthrough, so the image can fade in over it (feature 028). -->
  <span class="block">
    <!-- * The width sits on the element, not in a preset: @nuxt/image 2.0.0 builds the x1/x2 srcset from the element's own width. -->
    <!-- * `format` only matters in dev, where IPX would otherwise serve the softer WebP master instead of the AVIF production negotiates. -->
    <!-- * Keyed by source so a new one mounts a fresh image and is checked again. Every master is square, so `object-top` moves only the stretched panel. -->
    <NuxtImg
      ref="image"
      :key="src"
      :src="src"
      :width="PORTRAIT_WIDTHS[usage]"
      :loading="PORTRAIT_LOADING[usage]"
      densities="x1 x2"
      format="avif"
      :alt="alt"
      class="block size-full object-cover object-top"
      :class="LOAD_STATE_CLASS[loadState]"
      @load="handleLoad"
      @error="handleError"
      @animationend="settle"
      @animationcancel="settle"
    />
  </span>
</template>

<script setup lang="ts">
import { PORTRAIT_LOADING, PORTRAIT_WIDTHS } from '@/config/portraits';

import type { PortraitUsage } from '@/config/portraits';
import type { HeroId } from '@/types/hero';

// * `settled` is also the server render's state, so a page that never hydrates still shows its portraits.
type LoadState = 'settled' | 'loading' | 'fading' | 'failed';

// * `opacity-0` hides the browser's alt text along with the image; a failed portrait shows it again.
const LOAD_STATE_CLASS: Record<LoadState, string> = {
  settled: '',
  loading: 'opacity-0',
  fading: 'portrait-fade-in',
  failed: ''
};

const props = defineProps<{
  heroId: HeroId;
  usage: PortraitUsage;
  alt: string;
}>();

const image = useTemplateRef('image');

const { monsterForm } = useHeroPlanner();

const loadState = ref<LoadState>('settled');

const src = computed(() =>
  heroPortraitSrc(props.heroId, monsterForm.value ? 'monster' : 'hybrid')
);

// * An image the browser already holds is complete at mount and shows at once; only one still on its way fades in.
function checkLoaded() {
  const element = image.value?.imgEl;

  if (!element?.complete) {
    loadState.value = 'loading';
    return;
  }

  loadState.value = element.naturalWidth > 0 ? 'settled' : 'failed';
}

function handleLoad() {
  if (loadState.value === 'loading') {
    loadState.value = 'fading';
  }
}

// ! The class has to go once the fade ends: a CSS animation restarts whenever its element is shown again, so a portrait left `fading` would replay on every tab switch.
function settle() {
  if (loadState.value === 'fading') {
    loadState.value = 'settled';
  }
}

function handleError() {
  loadState.value = 'failed';
}

watch(src, checkLoaded, { flush: 'post' });

onMounted(checkLoaded);
</script>
