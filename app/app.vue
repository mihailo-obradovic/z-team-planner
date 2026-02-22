<template>
  <u-app>
    <u-header>
      <template #left> Z-Team Planner </template>

      <template #default>
        <div class="flex gap-6 items-center">
          <u-form-field label="Episode 3: Cut" orientation="horizontal">
            <u-select v-model="ep3Cut" :items="ep3CutItems" variant="subtle" />
          </u-form-field>

          <u-form-field label="Episode 4: Hire" orientation="horizontal">
            <u-select
              v-model="ep4Hire"
              :items="ep4HireItems"
              variant="subtle"
            />
          </u-form-field>

          <u-form-field label="Episode 8 recruits" orientation="horizontal">
            <u-switch v-model="showEp8Recruits" size="sm" />
          </u-form-field>

          <div class="flex items-center gap-2">
            <span class="text-sm text-muted">
              Power trainings: {{ trainingsUsed }}/{{ MAX_POWER_TRAININGS }}
            </span>
            <UButton
              v-if="trainingsUsed > 0"
              icon="i-lucide-rotate-ccw"
              size="xs"
              variant="soft"
              color="neutral"
              @click="resetAllPowerTrainings"
            />
          </div>
          <div class="flex items-center gap-2">
            <span class="text-sm text-muted">
              Flight trainings: {{ flightTrainingsUsed }}/{{
                MAX_FLIGHT_TRAININGS
              }}
            </span>
            <UButton
              v-if="flightTrainingsUsed > 0"
              icon="i-lucide-rotate-ccw"
              size="xs"
              variant="soft"
              color="neutral"
              @click="resetAllFlightTrainings"
            />
          </div>
          <div class="flex items-center gap-2">
            <span class="text-sm text-muted">
              Bonus points: {{ bonusLevelsUsed }}/{{ MAX_BONUS_POINTS }}
            </span>
            <UButton
              v-if="bonusLevelsUsed > 0"
              icon="i-lucide-rotate-ccw"
              size="xs"
              variant="soft"
              color="neutral"
              @click="resetAllBonusLevels"
            />
          </div>
        </div>
      </template>

      <template #right>
        <u-color-mode-button />
      </template>
    </u-header>

    <NuxtImg
      src="/images/background.png"
      class="fixed inset-0 w-full h-full object-cover opacity-20 pointer-events-none"
      alt=""
    />

    <u-main class="relative z-10">
      <NuxtPage />
    </u-main>
  </u-app>
</template>

<script setup lang="ts">
import {
  MAX_POWER_TRAININGS,
  MAX_FLIGHT_TRAININGS,
  MAX_BONUS_POINTS
} from '~/types/hero';

const {
  ep3Cut,
  ep4Hire,
  showEp8Recruits,
  ep3CutItems,
  ep4HireItems,
  trainingsUsed,
  flightTrainingsUsed,
  resetAllPowerTrainings,
  resetAllFlightTrainings,
  bonusLevelsUsed,
  resetAllBonusLevels
} = useHeroPlanner();

useHead({
  meta: [{ name: 'viewport', content: 'width=device-width, initial-scale=1' }],
  link: [{ rel: 'icon', href: '/favicon.ico' }],
  htmlAttrs: {
    lang: 'en'
  }
});

const title = 'Z-Team Planner';
const description =
  'A production-ready starter template powered by Nuxt UI. Build beautiful, accessible, and performant applications in minutes, not hours.';

useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description,
  ogImage: 'https://ui.nuxt.com/assets/templates/nuxt/starter-light.png',
  twitterImage: 'https://ui.nuxt.com/assets/templates/nuxt/starter-light.png',
  twitterCard: 'summary_large_image'
});
</script>
