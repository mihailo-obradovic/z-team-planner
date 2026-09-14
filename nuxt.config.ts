import { PORTRAIT_DENSITIES, portraitScreens } from './web/config/portraits';

export default defineNuxtConfig({
  modules: [
    '@nuxt/ui',
    '@nuxt/image',
    '@nuxt/test-utils',
    '@pinia/nuxt',
    '@pinia/colada-nuxt',
    '@regle/nuxt',
    '@nuxtjs/seo'
  ],

  srcDir: 'web/',

  // * Feature 026: the ground and the annex's loading ring that every `ssr: false` page (`/b/**`) paints until the app mounts. Nuxt would find the file by name in srcDir on its own; naming it says the file is deliberate and not a leftover.
  spaLoadingTemplate: 'spa-loading-template.html',

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

  css: ['@/assets/css/main.css'],

  // * Feature 021. `screens` is derived, not typed by hand: on Vercel it is also the optimizer's allowed sizes, and a width absent from it is snapped up to the next present one. The background wash is the one non-portrait image and keeps its master's width so the tightened list cannot shrink it.
  image: {
    quality: 90,
    densities: PORTRAIT_DENSITIES,
    screens: { ...portraitScreens(), background: 2560 }
  },

  nitro: {
    vercel: {
      config: {
        images: {
          // ! Not `image.vercel.minimumCacheTTL`: the provider has no such option and writes 300s itself. This block is merged with `defu`, so the explicit value wins. Masters change only by deliberate replacement; the reset is `vercel cache invalidate --srcimg` (operations.md).
          minimumCacheTTL: 31536000
        }
      }
    }
  },

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

        // * Dev-only, for local auth emulator
        authEmulatorHost: ''
      }
    }
  },

  hooks: {
    // ! `ready`, not `build:before`, and it takes the nuxt instance for one reason: `nuxt prepare` runs the build hooks too, and it sets NODE_ENV=production itself. Gating on NODE_ENV alone therefore failed every `pnpm install` that had no .env beside it — CI's install step, and any fresh clone — while passing locally because .env was there. `_prepare` is the flag that separates generating types from producing an artifact.
    ready(nuxt) {
      if (nuxt.options._prepare || nuxt.options.dev || nuxt.options.test) {
        return;
      }

      // * Only a deployable build gates on these (feature 006). `dev` is `nuxt dev`; `test` is vitest's Nuxt environment, which also builds, without .env, and is not an artifact. The two flags replace the earlier NODE_ENV check, which said the same thing one step removed.
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

  routeRules: {
    '/': { prerender: true },

    // * Reachable without the API, without JavaScript, and before sign-in exists: the consent screen links here (feature 010).
    '/privacy': { prerender: true },

    // * The shared-build page reads a per-request id from an API that needs a token-less fetch at view time; prerendering or SSRing it would serve one user's build to the next (feature 007).
    // * `robots: false` sets `X-Robots-Tag: noindex, nofollow` on the actual response (verified: `curl -I /b/test123`) — but it does NOT add a `robots.txt` Disallow line, since that file is generated from concrete/prerendered routes and `/b/[id]` is neither. The `robots.disallow` entry below is what actually keeps `/b/` out of `robots.txt`; this stays too as the per-request belt to that suspenders.
    '/b/**': { ssr: false, robots: false }
  },

  // * Feature 027. `/b/**` is excluded explicitly rather than relying on the sitemap module's default dynamic-route omission — the invariant ("never in the sitemap") should hold even if a dynamic-URL source is added here later.
  sitemap: {
    exclude: ['/b/**']
  },

  // * Feature 027. `disallow` is the actual source of `robots.txt`'s `Disallow: /b/` line — a wildcard `routeRules` entry alone (above) cannot produce it, since `/b/[id]` has no enumerable concrete routes for the static file generator to list.
  robots: {
    disallow: ['/b/']
  },

  site: {
    // TODO: Replace when deployed to a proper domain
    url: 'https://z-team-planner.vercel.app',
    name: 'Z-Team Planner',

    // * Matches `web/app.vue`'s `useSeoMeta` description verbatim — that call wins on every actual page render (component-level meta out-ranks Site Config's fallback), so this exists for what reads `site.description` directly instead (Schema.org's default identity, feature 027 step 4).
    description:
      'A build calculator for Dispatch. Plan your Z-Team ahead of time: level heroes, train powers and flight, pick synergy pairs, and mirror your story choices. Builds save in your browser and share as a link.'
  },

  ogImage: {
    enabled: false
  },

  compatibilityDate: '2026-08-25'
});
