# Frontend Addon: Rendering Postures

**Category:** rendering
**Tool:** Nuxt SSR · Nitro · Nuxt prerendering

This addon owns every **rendering posture** other than the base module's SPA — runtime server rendering and prerendering alike. Which posture a route takes is recorded in `routeRules` (`../nuxt.md`); what each one costs is here.

**Runtime SSR** — adopt when it earns its keep: content that must be indexed, a first paint that must not wait for a client round-trip, or data composition better done next to the API than in the browser. An authenticated app behind a login usually does not qualify — the base module's `ssr: false` posture is the default for a reason.

**Prerendering** — a route rendered once at build time and served as a static file. It needs no Nitro server at runtime, which is why a project can prerender its public pages and client-render everything else while still deploying as static assets. A route qualifies only if its output is **build-time constant**: nothing per-request, no identity, no data that changes between the build and the visit.

Adopting either is a decision record, not a config flag.

## What changes

- `ssr: false` comes out of the Nuxt config. Pages now render once on the server and hydrate on the client.
- **Every module-scope side effect becomes a bug.** Code that touched `window`, `document`, or `localStorage` at import time worked fine in an SPA and now runs on the server. Move it into `onMounted`, or guard it with `import.meta.client`.
- **Hydration mismatches become possible.** Anything non-deterministic in a render — a timestamp, a random id, a locale-formatted date read from the client's timezone — must produce the same output on both sides or be deferred to the client with `<ClientOnly>`. `<ClientOnly>` is for a value the server cannot know and the client knows at once; where the client's _first_ render is equally ignorant, the answer is a state rather than a boundary (`../../_common/layout-stability.md`, Values that are not known yet).
- Server-only work (secrets, direct database access) belongs in Nitro routes under `server/`, never in a component that also runs client-side.

## What a prerendering project owes

The hydration hazards above hold for prerendering too — a prerendered page is server-rendered output, just rendered earlier — and three habits follow from the server being a build machine that has no browser and no user:

- **`<ClientOnly>` around anything reading browser storage.** `localStorage` does not exist at build time, and a value read from it cannot be in the prerendered HTML.
- **`skipHydrate` on store state the server never populates.** Without it, Pinia tries to reconcile client state against a payload that was never written and warns, or worse, resets it.
- **An `import.meta.server` early return in any composable touching `window`.** At build time the guard is what stops the render crashing; in an SPA the same composable never ran anywhere but the browser, so the need is new.

## Data fetching

**This section is runtime SSR only.** A prerendered route has no request to fetch on behalf of: `useAsyncData` there runs on the build machine and bakes its result into the HTML, which is correct only for data as build-time constant as the route itself, and stale from the moment it is wrong. Anything else on a prerendered route goes through the base module's client-side data layer.

This is where the addon overrides the base module. `useFetch` and `useAsyncData` become the right tool for **initial page data** — they run on the server, serialize the result into the payload, and skip the duplicate client fetch that a client-only data layer would perform.

The two-layer data access in `../data-layer.md` does not go away; it narrows to what remains genuinely client-side — mutations, polling, optimistic updates, and anything fetched after the first paint. A page that fetches its own initial data on the server and mutates through Pinia Colada is the expected shape, not a contradiction.

Service functions stay useful on both paths: call them from inside `useAsyncData` so parsing and envelope-unwrapping still happen in one place.

## Cookie-session auth under SSR

The consequence most likely to be discovered late. Under `ssr: false` the browser holds the session cookie and attaches it automatically; under SSR the **server** makes the first request, and it has no cookie jar.

- Incoming cookies must be forwarded explicitly from the incoming request to the outgoing API call. Nothing does this by default.
- The CSRF retry in `../error-handling.md` assumes a browser that can be handed a fresh cookie. On the server there is no browser — a token failure during SSR surfaces as a failed render, not a silent retry.
- Session priming moves: what a client plugin did before the app mounted now belongs in server-side data fetching, or the first paint renders logged-out (superseding `../routing.md`, Priming the session).

Settle this before adopting SSR on a cookie-session API. Forwarding cookies per request is possible, but it leaves the CSRF retry and the priming gap above to solve by hand — the cleaner answer is usually a token the server holds and attaches deliberately, which is why a server-rendered frontend is the shape the backend's token auth choice exists for (on Laravel, `stacks/backend/laravel/auth/sanctum-token.md`).
