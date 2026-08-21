# Frontend Addon: Server-Side Rendering

**Category:** rendering
**Tool:** Nuxt SSR · Nitro

Adopt when server-side rendering earns its keep: content that must be indexed, a first paint that must not wait for a client round-trip, or data composition better done next to the API than in the browser. An authenticated app behind a login usually does not qualify — the base module's `ssr: false` posture is the default for a reason.

Adopting SSR is a decision record, not a config flag.

## What changes

- `ssr: false` comes out of the Nuxt config. Pages now render once on the server and hydrate on the client.
- **Every module-scope side effect becomes a bug.** Code that touched `window`, `document`, or `localStorage` at import time worked fine in an SPA and now runs on the server. Move it into `onMounted`, or guard it with `import.meta.client`.
- **Hydration mismatches become possible.** Anything non-deterministic in a render — a timestamp, a random id, a locale-formatted date read from the client's timezone — must produce the same output on both sides or be deferred to the client with `<ClientOnly>`.
- Server-only work (secrets, direct database access) belongs in Nitro routes under `server/`, never in a component that also runs client-side.

## Data fetching

This is where the addon overrides the base module. `useFetch` and `useAsyncData` become the right tool for **initial page data** — they run on the server, serialize the result into the payload, and skip the duplicate client fetch that a client-only data layer would perform.

The two-layer data access in `../data-layer.md` does not go away; it narrows to what remains genuinely client-side — mutations, polling, optimistic updates, and anything fetched after the first paint. A page that fetches its own initial data on the server and mutates through Pinia Colada is the expected shape, not a contradiction.

Service functions stay useful on both paths: call them from inside `useAsyncData` so parsing and envelope-unwrapping still happen in one place.

## Cookie-session auth under SSR

The consequence most likely to be discovered late. Under `ssr: false` the browser holds the session cookie and attaches it automatically; under SSR the **server** makes the first request, and it has no cookie jar.

- Incoming cookies must be forwarded explicitly from the incoming request to the outgoing API call. Nothing does this by default.
- The CSRF retry in `../error-handling.md` assumes a browser that can be handed a fresh cookie. On the server there is no browser — a token failure during SSR surfaces as a failed render, not a silent retry.
- Session priming moves: what a client plugin did before the app mounted now belongs in server-side data fetching, or the first paint renders logged-out (superseding `../routing.md`, Priming the session).

Settle this before adopting SSR on a cookie-session API. Forwarding cookies per request is possible, but it leaves the CSRF retry and the priming gap above to solve by hand — the cleaner answer is usually a token the server holds and attaches deliberately, which is why a server-rendered frontend is the shape the backend's token auth choice exists for (on Laravel, `stacks/backend/laravel/auth/sanctum-token.md`).
