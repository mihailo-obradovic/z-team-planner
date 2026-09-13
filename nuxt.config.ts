import { PORTRAIT_DENSITIES, portraitScreens } from './web/config/portraits';

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

        // * Development only, and empty everywhere else: with this set the web SDK talks to a local Auth emulator whose tokens are unsigned. The API refuses to start with its own emulator variable set outside development, which is the matching guard.
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
      // * The required list is the declared public config itself, so a key added above is required below without a second list to keep. Two are left out on purpose: NUXT_PUBLIC_API_BASE_URL, because an empty value is a valid deployment — the frontend with no API behind it — and means sign-in is unavailable rather than a broken build (decision 007); and the auth emulator host, which must be empty outside development.
      const optional = new Set(['apiBaseUrl', 'firebase.authEmulatorHost']);
      const missing = publicConfigPaths(nuxt.options.runtimeConfig.public)
        .filter((path) => !optional.has(path))
        .map(publicEnvName)
        .filter((name) => !process.env[name]);

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
    '/b/**': { ssr: false }
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
