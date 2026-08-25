<template>
  <UTabs
    :items="tabs"
    default-value="overview"
    class="flex h-full w-full flex-col"
    variant="link"
    :ui="{
      root: 'gap-0',
      list: 'shrink-0',
      content: 'min-h-0 flex-1 overflow-y-auto'
    }"
  >
    <template #default="{ item }">
      <!-- * Three full labels do not fit 390px, and truncating "Mission Simu…" is worse than a shorter honest name — so the label itself changes at sm rather than being clipped. -->
      <span class="sm:hidden">{{ item.shortLabel }}</span>
      <span class="hidden sm:inline">{{ item.label }}</span>
    </template>

    <template #overview>
      <div
        class="grid grid-cols-1 justify-center justify-items-center gap-x-6 gap-y-12 p-4 md:grid-cols-[repeat(2,auto)] 2xl:grid-cols-[repeat(4,auto)]"
      >
        <div
          v-for="pair in synergyPairColumns"
          :key="pair.topId"
          class="flex w-full max-w-92 flex-col gap-2"
        >
          <HeroCard
            :hero-id="pair.top.id as HeroId"
            @view-detail="selectedHeroId = pair.top.id as HeroId"
          />

          <!-- * The column *is* the pair, which is invisible once the cards stack into one phone-width list — so the pair says so itself, between its two heroes. `decorative` keeps the rules out of the a11y tree: a role="separator" makes its children presentational and would swallow the badge's text. -->
          <u-separator color="secondary" decorative>
            <!-- ! No type-role class here: Nuxt UI runs its class strings through tailwind-merge, which reads a custom `text-*` token as a colour and drops the variant's `text-warning` beside it. The badge's own size variant carries the size. -->
            <u-badge color="warning" variant="outline" icon="i-lucide-link-2">
              Synergy
            </u-badge>
          </u-separator>

          <HeroCard
            :hero-id="pair.bottom.id as HeroId"
            @view-detail="selectedHeroId = pair.bottom.id as HeroId"
          />
        </div>
      </div>

      <div v-if="showEp8Recruits" class="flex flex-col gap-8 p-4">
        <!-- * Without this the recruits read as a fifth synergy column. The heading is the h2 the cards' h3 names have been missing, so it carries the ruled band rather than a bare label. -->
        <u-separator color="secondary" decorative>
          <h2 class="font-heading text-label text-secondary-300 uppercase">
            Episode 8 recruits
          </h2>
        </u-separator>

        <div
          class="grid grid-cols-1 justify-center justify-items-center gap-x-6 gap-y-12 md:grid-cols-[repeat(2,auto)] 2xl:grid-cols-[repeat(3,auto)]"
        >
          <HeroCard
            v-for="hero in ep8Recruits"
            :key="hero.id"
            :hero-id="hero.id as HeroId"
            @view-detail="selectedHeroId = hero.id as HeroId"
          />
        </div>
      </div>
    </template>

    <template #synergy-pairs>
      <div class="p-4" />
    </template>

    <template #mission-simulator>
      <div class="p-4" />
    </template>
  </UTabs>

  <HeroDetailDialog :hero-id="selectedHeroId" @close="selectedHeroId = null" />
</template>

<script setup lang="ts">
import HeroCard from '@/components/HeroCard.vue';
import HeroDetailDialog from '@/components/HeroDetailDialog.vue';

import type { HeroId } from '@/types/hero';

const selectedHeroId = ref<HeroId | null>(null);

const tabs = [
  {
    label: 'Overview',
    shortLabel: 'Overview',
    value: 'overview',
    slot: 'overview'
  },
  {
    label: 'Synergy pairs',
    shortLabel: 'Synergy',
    value: 'synergy-pairs',
    slot: 'synergy-pairs'
  },
  {
    label: 'Mission simulator',
    shortLabel: 'Missions',
    value: 'mission-simulator',
    slot: 'mission-simulator'
  }
];

const { synergyPairColumns, ep8Recruits, showEp8Recruits } = useHeroPlanner();
</script>
