# Stack: Frontend — Nuxt

**Layer:** Frontend
**Tool:** Nuxt 4 · Vue 3 · TypeScript
**Requires:** _lang/typescript · frontend/_vue · frontend/_common

The Vue-side frontend module: a Nuxt 4 app running **as an SPA** (`ssr: false`) — pages render on the client and the app deploys as static assets against a separate API. Server-side rendering is the `ssr` addon; `addons/ssr.md` owns the adoption criteria. Binds the Universal Rules (Client And UI) to Nuxt; never restates a Universal Rule.

- Data fetching goes through the two-layer data access described in `data-layer.md` — a pure service function per endpoint, a Pinia Colada composable per operation. A GraphQL API keeps that contract and swaps the transport beneath it (`addons/graphql.md`).
- Every response is parsed against a Zod schema rather than asserted with a generic — a removed or renamed field fails at the boundary, not three components deep.
- Forms: Regle for client-side rules, mirroring the backend's validation for the endpoint. Server 422s render inline on the field, never as a toast.
- Errors are handled centrally, once, at the query layer — components carry no try-catch and no manual loading flags.
- Client state is Pinia, and only what no server owns (`client-state.md`); server-owned data stays in Pinia Colada rather than being mirrored into a store.
- Styling and component primitives are the `frontend/ui` choice.
- Tests: Vitest with `@nuxt/test-utils` and Vue Test Utils.

## Module Documents

| Document            | What it holds                                                                                  | Load                                                                      |
| ------------------- | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `nuxt.md`           | This document — the module contract and approved libraries                                     | Always, with the module                                                   |
| `data-layer.md`     | The two-layer service + Pinia Colada contract, query keys, cache invalidation                  | When fetching, mutating, or caching server data                           |
| `client-state.md`   | Pinia stores — what belongs in one, store shape, and the server-state boundary                 | When adding or changing a store                                           |
| `validation.md`     | Zod for responses, Regle for requests, and the inline-not-toast 422 path                       | When validating a request or a response payload                           |
| `error-handling.md` | The fetcher, CSRF retry, and the central error policy                                          | When adding a fetcher call, or changing how failures surface              |
| `routing.md`        | Pages, layouts, and middleware-as-thin-adapter                                                 | When adding or changing pages, layouts, or middleware                     |
| `page-layout.md`    | The height chain from the shell to a page, and the full-height column a scrolling region needs | When building a page layout, or when a region must scroll inside the page |
| `design-system.md`  | Design-system template — instantiated into a project-owned convention annex at Init Design     | At Init Design, and when the project's design annex changes               |

The shared tiers `_lang/typescript`, `frontend/_vue`, and `frontend/_common` travel with this module and hold the language-level, Vue-general, and framework-agnostic frontend conventions; the style guide `../_vue/vue-style.md` is the authoritative Vue style rules.

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
