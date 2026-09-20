import { PORTRAIT_DENSITIES, portraitScreens } from './web/config/portraits';

export default defineNuxtConfig({
  srcDir: 'web/',

  components: {
    dirs: ['@/components/_shared']
  },

  // * Composables are grouped by subject like the components are; Nuxt scans only the top level of `composables/` without this.
  imports: {
    dirs: ['@/composables/**']
  },

  css: ['@/assets/css/main.css'],

  app: {
    // * A page arrives the way a tab does (feature 010): the tab fade on enter, the leaving page cut. `out-in` keeps the two from overlapping.
    pageTransition: { enterActiveClass: 'tab-fade', mode: 'out-in' }
  },

  runtimeConfig: {
    public: {
      apiBaseUrl: '',

      firebase: {
        apiKey: '',
        authDomain: '',
        projectId: '',
        appId: '',

        // * Dev-only, for local auth emulator
        authEmulatorHost: ''
      }
    }
  },

  hooks: {
    // ! `ready` with `_prepare`, not `build:before`: `nuxt prepare` runs build hooks with NODE_ENV=production.
    ready(nuxt) {
      if (nuxt.options._prepare || nuxt.options.dev || nuxt.options.test) {
        return;
      }

      // * API base URL is optional (decision 007); the emulator host must be empty outside dev.
      const missing = [
        'NUXT_PUBLIC_FIREBASE_API_KEY',
        'NUXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
        'NUXT_PUBLIC_FIREBASE_PROJECT_ID',
        'NUXT_PUBLIC_FIREBASE_APP_ID',
        'NUXT_SITE_URL',
        'NUXT_SITE_ENV'
      ].filter((name) => !process.env[name]);

      if (missing.length > 0) {
        throw new Error(
          `Missing required public runtime config: ${missing.join(', ')}. See .env.example.`
        );
      }
    }
  },

  modules: [
    '@nuxt/ui',
    '@nuxt/image',
    '@nuxt/test-utils',
    '@pinia/nuxt',
    '@pinia/colada-nuxt',
    '@regle/nuxt',
    '@nuxtjs/seo'
  ],

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

  image: {
    quality: 90,
    densities: PORTRAIT_DENSITIES,
    screens: { ...portraitScreens(), background: 2560 }
  },

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

  routeRules: {
    '/': { prerender: true },
    '/privacy': { prerender: true },

    // * Served per request from the API; prerender or SSR would leak one user's build to the next (feature 007).
    '/b/**': { ssr: false, robots: false }
  },

  site: {
    // TODO: Replace when deployed to a proper domain
    url: 'https://z-team-planner.vercel.app',
    name: 'Z-Team Planner',

    description:
      "A build calculator for Dispatch: plan your Z-Team's levels, powers and flight, including synergy pair stats and bonuses."
  },

  sitemap: {
    exclude: ['/b/**']
  },

  robots: {
    disallow: ['/b/']
  },

  ogImage: {
    enabled: false
  },

  nitro: {
    vercel: {
      config: {
        images: {
          // ! The image provider has no TTL option and writes 300s itself; this block overrides it.
          minimumCacheTTL: 31536000
        }
      }
    }
  },

  compatibilityDate: '2026-09-14'
});
