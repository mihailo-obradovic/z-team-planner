# Stack: Frontend — Nuxt

**Layer:** Frontend
**Tool:** Nuxt 4 · Vue 3 · TypeScript
**Requires:** _lang/typescript · frontend/_vue · frontend/_common

The Vue-side frontend module: a Nuxt 4 app running **as an SPA** (`ssr: false`) by default — pages render on the client and the app deploys as static assets against a separate API. Binds the Universal Rules (Client And UI) to Nuxt; never restates a Universal Rule.

**Rendering is a per-route decision, recorded in `routeRules`.** The module's default is the app-wide posture, not the only one available: **prerender what is build-time constant, client-render what reads per-request identity, and server-render only with a reason.** A marketing page and a user's private workspace do not want the same answer, and `routeRules` is where that is said once, per route, rather than inferred from a global flag.

```ts
routeRules: {
  '/': { prerender: true },

  // * Served per request from the API; prerendering would bake one user's data into the build.
  '/app/**': { ssr: false }
}
```

Every posture other than SPA — prerendering included — is the `ssr` addon's subject: `addons/ssr.md` owns the adoption criteria and the hazards each one brings.

- Data fetching goes through the two-layer data access described in `data-layer.md` — a pure service function per endpoint, a Pinia Colada composable per operation. A GraphQL API keeps that contract and swaps the transport beneath it (`addons/graphql.md`).
- Every response is parsed against a Zod schema rather than asserted with a generic — a removed or renamed field fails at the boundary, not three components deep.
- Forms: Regle for client-side rules, mirroring the backend's validation for the endpoint. Server 422s render inline on the field, never as a toast.
- Errors are handled centrally, once, at the query layer — components carry no try-catch and no manual loading flags.
- Client state is Pinia, and only what no server owns (`client-state.md`); server-owned data stays in Pinia Colada rather than being mirrored into a store.
- Styling and component primitives are the `frontend/ui` choice.
- Tests: Vitest with `@nuxt/test-utils` and Vue Test Utils.

## The order of `nuxt.config.ts`

Six groups, in this order, separated by blank lines. No group header comments — [`code-annotations.md`](../../../conventions/code-annotations.md) allows no banner comments.

1. **Shape of the source** — `srcDir`, `dir`, `alias`, `extends`, `components`, `imports`, `css`, `spaLoadingTemplate`.
2. **App inputs** — `runtimeConfig`, `app`, `hooks`.
3. **`modules`** — the array alone.
4. **Module configuration** — one block per module, in the array's order.
5. **Framework behaviour and output** — `ssr`, `routeRules`, `typescript`, `vite`, `nitro`, `devtools`, `experimental`, `future`.
6. **`compatibilityDate`** — the last key in the file.

**A key no group names:** contributed by a module in `modules` → group 4, beside that module; anything else is core and takes the group its subject belongs to. A core key that reads as two groups takes the earlier one.

**A meta-module's registered keys sit inside its own block**, never as separate entries: `@nuxt/ui` registers `@nuxt/fonts`, so `fonts` follows `ui` (`ui/nuxtui/nuxtui.md`); a SEO meta-module's `site`, `sitemap`, `robots`, and `ogImage` follow its entry.

**`modules` is ordered by load requirement first** — Nuxt executes the array sequentially, so a module that must run before another outranks any cosmetic order. Where load order is free, official `@nuxt/*` modules precede ecosystem packages. Never alphabetical.

```ts
export default defineNuxtConfig({
  srcDir: 'web/',

  css: ['@/assets/css/main.css'],

  runtimeConfig: {
    public: {
      apiBaseUrl: ''
    }
  },

  modules: ['@nuxt/ui', '@nuxt/image'],

  ui: {
    colorMode: false
  },

  image: {
    quality: 90
  },

  routeRules: {
    '/': { prerender: true }
  },

  compatibilityDate: '2026-09-14'
});
```

## `srcDir` is the project's own

Nuxt's default `srcDir` is `app/`, and a project is free to use another. Two generated paths follow it, both written by the scaffolder at the default because it never asks:

- **`sortTailwindcss.stylesheet`** in `.oxfmtrc.json` — the path to the global stylesheet.
- **The vendored-config `overrides` glob** in the same file, where the `frontend/ui` choice vendors component themes.

Neither fails loudly when wrong. A stylesheet path that resolves to nothing makes the project's own `@theme` utilities unknown classes, and unknown classes sort to the **front** of every class list — visible only as churn nobody ordered. Change `srcDir` and both paths change with it.

## `.nuxtrc` is generated and versioned

`.nuxtrc` records module setup state (`setups.<module>="<version>"`) and Nuxt rewrites it whenever it loads. It is committed anyway, unlike `.nuxt/`, which is ignored: gitignoring it makes it permanent untracked noise in every working tree, and deleting it re-triggers every module's setup on the next run.

## Module Documents

| Document                      | What it holds                                                                                  | Load                                                                      |
| ----------------------------- | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `nuxt.md`                     | This document — the module contract and approved libraries                                     | Always, with the module                                                   |
| `data-layer.md`               | The two-layer service + Pinia Colada contract, query keys, cache invalidation                  | When fetching, mutating, or caching server data                           |
| `client-state.md`             | Client state — `useState`, shared composables, Pinia stores, and the server-state boundary     | When adding or changing a store or a shared composable                    |
| `validation.md`               | Zod for responses, Regle for requests, and the inline-not-toast 422 path                       | When validating a request or a response payload                           |
| `error-handling.md`           | The fetcher, CSRF retry, and the central error policy                                          | When adding a fetcher call, or changing how failures surface              |
| `routing.md`                  | Pages, layouts, and middleware-as-thin-adapter                                                 | When adding or changing pages, layouts, or middleware                     |
| `page-layout.md`              | The height chain from the shell to a page, and the full-height column a scrolling region needs | When building a page layout, or when a region must scroll inside the page |
| `../_common/design-system.md` | Design-system template — instantiated into a project-owned convention annex at Init Design     | At Init Design, and when the project's design annex changes               |

The shared tiers `_lang/typescript`, `frontend/_vue`, and `frontend/_common` travel with this module and hold the language-level, Vue-general, and framework-agnostic frontend conventions (including the design-system template); the style guide `../_vue/vue-style.md` is the authoritative Vue style rules.

## Grouping composables

`composables/` is grouped by subject on the same terms as `components/` (`../_common/component-naming.md`, Group by subject), with one wiring step the grouping does not survive without.

**Nuxt scans only the top level of `composables/`.** Move a composable into `composables/hero/` and it stops being auto-imported — silently, because the file is still there and still exported. The fix is one config key:

```ts
export default defineNuxtConfig({
  imports: {
    dirs: ['@/composables/**']
  }
});
```

Verified on Nuxt 4.3.0: the directory is normalised to the glob `composables/*.{ts,…}`, top-level files and nothing below them, and `imports.dirs` is what widens it.

**The cost, stated up front: the auto-import namespace stays flat however deep the folders go.** Two composables of the same name in different subject folders collide, and scan order decides which one wins — no error, no warning. The self-describing-basename rule is doing real work here; a folder is not a namespace.

## Approved Libraries

- Nuxt 4, Vue 3, TypeScript.
- Pinia and `@pinia/colada` (with `@pinia/colada-nuxt`) — client state and server state respectively.
- Zod (response schemas); `@regle/core` + `@regle/rules` (with `@regle/nuxt`) — form validation.
- `@vueuse/core`.
- Vitest, `@nuxt/test-utils`, `@vue/test-utils`.
- pnpm as the package manager.

## Avoid By Default

- `useFetch` / `useAsyncData` for application data — the data layer owns fetching, and these bypass its caching, error handling, and schema parsing. They are the `ssr` addon's tools.
- Nitro `server/` routes and server middleware — the static build ships no server runtime, so they never execute; cross-cutting request logic belongs to the backend API. Also the `ssr` addon's tools.
- Raw `useQuery` / `useMutation` from Pinia Colada — always the project's `useAppQuery` / `useAppMutation` wrappers, which is where central error handling attaches.
- Mirroring server-owned data into a Pinia store — Pinia Colada owns server state; stores hold client state.
- Manual `ref()` loading flags and per-component try-catch around API calls.
- Asserting response shapes with `fetcher<T>()` generics instead of parsing them.
