export default defineNuxtConfig({
  modules: ['@nuxt/ui', '@nuxt/image', '@nuxt/test-utils'],

  // * The Nuxt app lives in web/ so the FastAPI application can take the root app/ (decision 004)
  srcDir: 'web/',

  components: {
    dirs: ['@/components/_shared']
  },

  devtools: {
    enabled: true
  },

  css: ['~/assets/css/main.css', 'vue-data-ui/style.css'],

  ui: {
    colorMode: false
  },

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

  compatibilityDate: '2026-08-25'
});
