import { PORTRAIT_DENSITIES, portraitScreens } from './web/config/portraits';

// * Decision 018: every route's static security headers. A `<meta>` CSP cannot carry `frame-ancestors`, so it is a header; same-origin-allow-popups, because plain same-origin breaks the sign-in popup.
const SECURITY_HEADERS = {
  'Content-Security-Policy': "frame-ancestors 'none'",
  'X-Frame-Options': 'DENY',
  'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin'
} as const;

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
      // ! Nuxt's client build strips `onServerPrefetch`, yet Vue numbers `useId` past a component that has one (app.vue's query). Stripped, prerendered and hydrated ids diverge and every client-set `aria-controls` dangles. Delete once Nuxt stops stripping it (Post-release: Nuxt upstream report).
      const clientTreeShake =
        nuxt.options.optimization.treeShake.composables.client;
      if (clientTreeShake.vue) {
        clientTreeShake.vue = clientTreeShake.vue.filter(
          (name) => name !== 'onServerPrefetch'
        );
      }

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
    },

    // ! nuxt-security hashes public assets before @nuxt/fonts has written its files, so the preloaded font would carry the hash of an empty file and be blocked. Fonts are not scripts, so the CSP loses nothing without their hashes (decision 018). `nitro:config`, not `ready`: Nitro has copied its virtual modules by then. Delete once nuxt-security hashes after the fonts are written (Post-release: nuxt-security upstream report).
    'nitro:config'(nitroConfig) {
      const sriHashes = nitroConfig.virtual?.['#sri-hashes'];
      if (!nitroConfig.virtual || typeof sriHashes !== 'function') {
        return;
      }

      nitroConfig.virtual['#sri-hashes'] = async () => {
        const source = String(await sriHashes());
        const hashes: Record<string, string> = JSON.parse(
          source.slice(source.indexOf('{'))
        );
        const scriptHashes = Object.fromEntries(
          Object.entries(hashes).filter(
            ([path]) => !path.startsWith('/_fonts/')
          )
        );
        return `export default ${JSON.stringify(scriptHashes)}`;
      };
    }
  },

  modules: [
    '@nuxt/ui',
    '@nuxt/image',
    '@nuxt/test-utils',
    '@pinia/nuxt',
    '@pinia/colada-nuxt',
    '@nuxtjs/seo',
    'nuxt-security'
  ],

  // * Decision 018: the module owns the CSP; every other header it knows is either `SECURITY_HEADERS` or off, and its middleware is off. Prerendered pages get hashes and SRI, `/b/**` a nonce per request.
  security: {
    nonce: true,
    sri: true,
    removeLoggers: false,
    hidePoweredBy: false,
    rateLimiter: false,
    requestSizeLimiter: false,
    xssValidator: false,
    corsHandler: false,
    allowedMethodsRestricter: false,
    // ! The `routeRules` values again: on `/b/**`'s function response the module sets these itself, and a `false` would strip the `routeRules` header rather than leave it.
    headers: {
      xFrameOptions: SECURITY_HEADERS['X-Frame-Options'],
      crossOriginOpenerPolicy: SECURITY_HEADERS['Cross-Origin-Opener-Policy'],
      strictTransportSecurity: { maxAge: 31536000, includeSubdomains: true },
      xContentTypeOptions: SECURITY_HEADERS['X-Content-Type-Options'],
      referrerPolicy: SECURITY_HEADERS['Referrer-Policy'],
      crossOriginResourcePolicy: false,
      crossOriginEmbedderPolicy: false,
      originAgentCluster: false,
      xDNSPrefetchControl: false,
      xDownloadOptions: false,
      xPermittedCrossDomainPolicies: false,
      xXSSProtection: false,
      permissionsPolicy: false,
      contentSecurityPolicy: {
        'default-src': ["'self'"],
        'base-uri': ["'none'"],
        'object-src': ["'none'"],
        'form-action': ["'self'"],
        // * Only `/b/**`'s per-request header carries it; a `<meta>` CSP drops it, so the prerendered pages rely on the `routeRules` header.
        'frame-ancestors': ["'none'"],
        // * 'strict-dynamic' lets gapi in through Firebase's own trusted script; the host and 'unsafe-inline' are fallbacks only browsers without it read.
        'script-src': [
          "'self'",
          "'strict-dynamic'",
          "'unsafe-inline'",
          "'nonce-{{nonce}}'",
          'https://apis.google.com'
        ],
        'script-src-attr': ["'none'"],
        'style-src': ["'self'", "'unsafe-inline'"],
        'img-src': ["'self'", 'data:'],
        'font-src': ["'self'"],
        'connect-src': [
          "'self'",
          'https://identitytoolkit.googleapis.com',
          'https://securetoken.googleapis.com',
          'https://www.googleapis.com'
        ],
        'frame-src': [
          'https://z-team-planner.firebaseapp.com',
          'https://accounts.google.com'
        ],
        'upgrade-insecure-requests': true
      }
    }
  },

  // * Dev keeps HMR and the auth emulator on :9099 out of the policy.
  $development: {
    security: { enabled: false }
  },

  ui: {
    colorMode: false
  },

  // * `true` preloads one face per family, the weight nearest 400 in the first subset: the body text, which is right for Barlow and wrong for Barlow Condensed (it would pick 600, which the first paint never sets). The title's 800 and the labels' 700 wait for the module's per-weight `preload` object, which @nuxt/fonts 0.14 does not have yet (decision 017).
  fonts: {
    families: [
      {
        name: 'Barlow',
        provider: 'google',
        weights: [400, 500, 600, 700],
        styles: ['normal'],
        preload: true
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
    screens: portraitScreens(),
    // * Registers the built-in pass-through provider the background wash names (decision 017): a built-in provider exists only when its key is configured.
    none: {},
    // ! Unset, the Vercel provider writes a 300s edge cache; the masters change only by deliberate replacement (operations.md).
    vercel: { minimumCacheTTL: 31536000 }
  },

  // * Decision 017: every icon the app names ships in the client bundle, so no `/api/_nuxt_icon` request follows a paint. Nuxt UI adds its own defaults to the same bundle; the scan covers `.ts` too, since the hero stat and power icons are named in composables and utils.
  icon: {
    clientBundle: { scan: { globInclude: ['**/*.{vue,ts}'] } }
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
    '/**': { headers: SECURITY_HEADERS },
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

  seo: {
    // ! Its error titles carry the status, Nuxt's `Page not found: <path>` message, or the last path segment; `plugins/error-title.ts` titles the error page instead (feature 009).
    fallbackTitle: false,
    // * Open Graph only: X reads og:* without twitter:* tags, and unhead v3 deprecates them (feature 027).
    automaticTwitterTags: false
  },

  vite: {
    optimizeDeps: {
      include: [
        '@unhead/schema-org/vue',
        'firebase/app',
        'firebase/auth',
        'temporal-polyfill',
        '@regle/core',
        '@regle/rules',
        'zod/mini'
      ]
    }
  },

  compatibilityDate: '2026-09-14'
});
