<template>
  <!-- * Every tile is bordered, so the open hero differs by colour without nudging its neighbours. -->
  <ScrollRegion
    ref="strip"
    as="nav"
    :axis="variant === 'ribbon' ? 'horizontal' : 'vertical'"
    :class="STRIP_CLASS[variant]"
    aria-label="Roster"
  >
    <button
      v-for="hero in heroes"
      ref="tiles"
      :key="hero.id"
      type="button"
      class="shrink-0 border-2 select-none"
      :class="[
        TILE_CLASS[variant],
        hero.id === activeId ? 'border-primary' : INACTIVE_TILE_CLASS[variant]
      ]"
      :aria-current="hero.id === activeId ? 'true' : undefined"
      :aria-label="hero.name"
      @click="handleSelect(hero.id, $event)"
    >
      <HeroPortrait
        :hero-id="hero.id"
        :usage="variant"
        :alt="hero.name"
        class="size-full object-cover object-top"
      />
    </button>
  </ScrollRegion>
</template>

<script setup lang="ts">
import HeroPortrait from '@/components/HeroPortrait.vue';

import type { Hero, HeroId } from '@/types/hero';

type StripVariant = 'rail' | 'ribbon';

// * Structural, so the strip needn't import an auto-imported component for its type.
type RosterRegion = { bringIntoView: (target: HTMLElement) => void };

const STRIP_CLASS: Record<StripVariant, string> = {
  rail: 'hidden w-24 shrink-0 flex-col gap-2 lg:flex',
  ribbon: 'flex shrink-0 gap-2 lg:hidden'
};

const TILE_CLASS: Record<StripVariant, string> = {
  rail: 'aspect-square',
  ribbon: 'size-14'
};

const INACTIVE_TILE_CLASS: Record<StripVariant, string> = {
  rail: 'border-default opacity-70 hover:opacity-100',
  ribbon: 'border-default opacity-70'
};

const props = defineProps<{
  heroes: Hero[];
  activeId: HeroId | null;
  variant: StripVariant;
}>();

const emit = defineEmits<{
  select: [heroId: HeroId];
}>();

const strip = useTemplateRef<RosterRegion>('strip');
const tiles = useTemplateRef<HTMLElement[]>('tiles');

// * Followed on click rather than through the parent's watcher: clicking the open hero changes nothing to watch.
function handleSelect(heroId: HeroId, event: MouseEvent) {
  const tile = event.currentTarget;

  if (tile instanceof HTMLElement) {
    strip.value?.bringIntoView(tile);
  }

  emit('select', heroId);
}

// * The hidden strip measures zero and no-ops, so the parent asks both without knowing the tier.
function follow() {
  const index = props.heroes.findIndex((hero) => hero.id === props.activeId);
  const tile = tiles.value?.[index];

  if (tile) {
    strip.value?.bringIntoView(tile);
  }
}

// * A tile in the hidden strip has no rect.
function isDisplayed(): boolean {
  return tiles.value?.[0]?.getClientRects().length !== 0;
}

defineExpose({ follow, isDisplayed });
</script>
