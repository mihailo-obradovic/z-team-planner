export default defineNuxtConfig({
  modules: [
    '@nuxt/ui',
    '@nuxt/image',
    '@nuxt/test-utils',
    '@pinia/nuxt',
    '@pinia/colada-nuxt',
    '@regle/nuxt'
  ],

  // * The Nuxt app lives in web/ so the FastAPI application can take the root app/ (decision 004)
  srcDir: 'web/',

  // * Neither scripts/ nor test/unit/ is in any tsconfig Nuxt generates, so both went entirely
  // * unchecked by `pnpm typecheck`. test/unit joins the app context for its `@/` alias; scripts
  // * joins the node context. Paths are relative to the generated files in .nuxt/.
  typescript: {
    tsConfig: {
      include: ['../test/unit/**/*'],
      // * scripts/export-game-data.ts runs as `node scripts/export-game-data.ts`, where Node
      // * strips types itself and the import extensions must be spelled. The test imports it.
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
      // * No default: NUXT_PUBLIC_API_BASE_URL is required, and the build:before hook below fails the build rather than shipping a bundle pointed at nothing (feature 006).
      apiBaseUrl: '',

      // * Public by design — these four ship in the browser bundle and are not secrets.
      firebase: {
        apiKey: '',
        authDomain: '',
        projectId: '',
        appId: '',

        // * Development only, and empty everywhere else: with this set the web SDK talks to a
        // * local Auth emulator whose tokens are unsigned. The API refuses to start with its
        // * own emulator variable set outside development, which is the matching guard.
        authEmulatorHost: ''
      }
    }
  },

  hooks: {
    'build:before'() {
      // * Only a real production build gates on these. `nuxt build` sets NODE_ENV=production;
      // * vitest's Nuxt environment builds too but does not load .env, and a test run is not a
      // * deployable artifact — gating it would fail the suite for a risk it does not carry.
      if (process.env.NODE_ENV !== 'production') {
        return;
      }

      const missing = [
        'NUXT_PUBLIC_API_BASE_URL',
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

    // * The shared-build page reads a per-request id from an API that needs a token-less fetch at view time; prerendering or SSRing it would serve one user's build to the next (feature 006).
    '/b/**': { ssr: false }
  },

  compatibilityDate: '2026-08-25'
});
