// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ['@nuxt/ui', '@nuxt/image', '@nuxt/test-utils'],

  components: {
    dirs: ['@/components/_shared']
  },

  devtools: {
    enabled: true
  },

  css: ['~/assets/css/main.css', 'vue-data-ui/style.css'],

  // * One fixed theme — decision 003, catalyst/annexes/design-system.md §1
  ui: {
    colorMode: false
  },

  // * @nuxt/fonts is registered by @nuxt/ui; configured here, never in modules.
  // * Weights are only those the type scale uses (annex §2).
  fonts: {
    families: [
      {
        name: 'Barlow',
        provider: 'google',
        weights: [400, 500, 600, 700],
        styles: ['normal']
      },
      {
        name: 'Barlow Condensed',
        provider: 'google',
        weights: [600, 700, 800],
        styles: ['normal']
      }
    ]
  },

  routeRules: {
    '/': { prerender: true }
  },

  compatibilityDate: '2025-01-15'
});
