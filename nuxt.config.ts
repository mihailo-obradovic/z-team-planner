export default defineNuxtConfig({
  modules: [
    '@nuxt/ui',
    '@nuxt/image',
    '@nuxt/test-utils',
    '@pinia/nuxt',
    '@pinia/colada-nuxt',
    '@regle/nuxt'
  ],

  srcDir: 'web/',

  // * Nuxt's generated tsconfigs cover neither test/unit/ (app context, for the `@/` alias) nor scripts/ (node context); paths are relative to .nuxt/. The extension flag: scripts/export-game-data.ts runs under bare `node`, so its imports spell `.ts`, and test/unit imports it the same way.
  typescript: {
    tsConfig: {
      include: ['../test/unit/**/*'],
      compilerOptions: {
        allowImportingTsExtensions: true
      }
    },
    nodeTsConfig: {
      include: ['../scripts/**/*'],
      compilerOptions: {
        allowImportingTsExtensions: true
      }
    }
  },

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

  runtimeConfig: {
    public: {
      apiBaseUrl: '',

      firebase: {
        apiKey: '',
        authDomain: '',
        projectId: '',
        appId: '',

        // * Development only, and empty everywhere else: with this set the web SDK talks to a local Auth emulator whose tokens are unsigned. The API refuses to start with its own emulator variable set outside development, which is the matching guard.
        authEmulatorHost: ''
      }
    }
  },

  hooks: {
    'build:before'() {
      // * Only a real production build gates on these (feature 006): `nuxt build` sets NODE_ENV=production, while vitest's Nuxt environment also builds, without .env, and is not a deployable artifact.
      if (process.env.NODE_ENV !== 'production') {
        return;
      }

      // * NUXT_PUBLIC_API_BASE_URL is deliberately absent: an empty value is a valid deployment — the frontend with no API behind it — and means sign-in is unavailable rather than a broken build (decision 007).
      const missing = [
        'NUXT_PUBLIC_FIREBASE_API_KEY',
        'NUXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
        'NUXT_PUBLIC_FIREBASE_PROJECT_ID',
        'NUXT_PUBLIC_FIREBASE_APP_ID'
      ].filter((key) => !process.env[key]);

      if (missing.length > 0) {
        throw new Error(
          `Missing required public runtime config: ${missing.join(', ')}. See .env.example.`
        );
      }
    }
  },

  routeRules: {
    '/': { prerender: true },

    // * The shared-build page reads a per-request id from an API that needs a token-less fetch at view time; prerendering or SSRing it would serve one user's build to the next (feature 007).
    '/b/**': { ssr: false }
  },

  compatibilityDate: '2026-08-25'
});
