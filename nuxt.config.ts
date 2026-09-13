import { PORTRAIT_DENSITIES, portraitScreens } from './web/config/portraits';

// * Feature 006's build guard (below) walks this object by reference rather than `nuxt.options.runtimeConfig.public`: modules write their own internal state into that tree at setup time (feature 027's `@nuxtjs/seo` sub-modules add ~30 keys of their own), and the guard must only require an env var for what this project itself declares.
const ownPublicRuntimeConfig = {
  apiBaseUrl: '',

  firebase: {
    apiKey: '',
    authDomain: '',
    projectId: '',
    appId: '',

    // * Development only, and empty everywhere else: with this set the web SDK talks to a local Auth emulator whose tokens are unsigned. The API refuses to start with its own emulator variable set outside development, which is the matching guard.
    authEmulatorHost: ''
  }
};

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
    public: ownPublicRuntimeConfig
  },

  hooks: {
    // ! `ready`, not `build:before`, and it takes the nuxt instance for one reason: `nuxt prepare` runs the build hooks too, and it sets NODE_ENV=production itself. Gating on NODE_ENV alone therefore failed every `pnpm install` that had no .env beside it — CI's install step, and any fresh clone — while passing locally because .env was there. `_prepare` is the flag that separates generating types from producing an artifact.
    ready(nuxt) {
      if (nuxt.options._prepare || nuxt.options.dev || nuxt.options.test) {
        return;
      }

      // * Only a deployable build gates on these (feature 006). `dev` is `nuxt dev`; `test` is vitest's Nuxt environment, which also builds, without .env, and is not an artifact. The two flags replace the earlier NODE_ENV check, which said the same thing one step removed.
      // * The required list is the declared public config itself (`ownPublicRuntimeConfig`, not `nuxt.options.runtimeConfig.public` — see its own comment), so a key added there is required below without a second list to keep. Two are left out on purpose: NUXT_PUBLIC_API_BASE_URL, because an empty value is a valid deployment — the frontend with no API behind it — and means sign-in is unavailable rather than a broken build (decision 007); and the auth emulator host, which must be empty outside development.
      const optional = new Set(['apiBaseUrl', 'firebase.authEmulatorHost']);
      // * NUXT_SITE_URL/NUXT_SITE_ENV sit outside `runtimeConfig.public` (feature 027) — nuxt-site-config reads them straight off `process.env`, so they join the same required-key mechanism by name instead of through `publicConfigPaths`.
      const missing = [
        ...publicConfigPaths(ownPublicRuntimeConfig)
          .filter((path) => !optional.has(path))
          .map(publicEnvName),
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
    description:
      'Plan your Dispatch build ahead of time — level heroes, train powers and flight, and pick synergy pairs before you commit in-game.'
  },

  compatibilityDate: '2026-08-25'
});

// * Dotted paths of every leaf under `runtimeConfig.public`, in declaration order.
function publicConfigPaths(
  config: Record<string, unknown>,
  prefix = ''
): string[] {
  return Object.entries(config).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;

    if (value !== null && typeof value === 'object') {
      return publicConfigPaths(value as Record<string, unknown>, path);
    }

    return [path];
  });
}

// * The environment variable Nuxt reads a public key from: `firebase.apiKey` → NUXT_PUBLIC_FIREBASE_API_KEY.
function publicEnvName(path: string): string {
  const snake = path
    .replace(/\./g, '_')
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .toUpperCase();

  return `NUXT_PUBLIC_${snake}`;
}
