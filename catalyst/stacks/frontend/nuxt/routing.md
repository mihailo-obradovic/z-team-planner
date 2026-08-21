# Nuxt Routing

**Layer:** Frontend
**Tool:** Nuxt file-based routing · Vue Router

Routing conventions for the SPA posture. The `ssr` addon adds server-side concerns on top: routing, middleware, and navigation below hold unchanged, but **Priming the session** is superseded — when the addon is adopted, its docs (`addons/ssr.md`) own that half.

## Pages

- Routes are files under `@/pages/`. **URL segments are kebab-case**, matching the file name — `password-reset.vue`, not `passwordReset.vue`. This is the one place the PascalCase component-file rule does not apply (`../_common/component-naming.md`).
- Dynamic segments are `[param].vue`; catch-alls `[...slug].vue`.
- `definePageMeta` goes immediately after imports (`../_vue/vue-style.md`, section 6) and carries the layout choice, middleware, and page-level metadata.
- A page composes; it does not implement. Pages that grow past composition — data wiring, a form, a table, three dialogs — split into components under `@/components/<feature>/`, which are imported explicitly.

## Layouts

- Layouts live in `@/layouts/`; `default.vue` applies where a page names none.
- An **empty layout** — a bare centered slot with no navigation — is worth having from the start for login, error, and standalone pages. Retrofitting one means unpicking chrome from the default layout later.
- App-wide chrome (header, navigation, footer) belongs to a layout, never to individual pages.

## Middleware is a thin adapter

The rule that matters in this document: **route middleware contains no policy.** It is an adapter that calls a pure function and acts on the answer.

```ts
export default defineNuxtRouteMiddleware((to) => {
  const decision = determineAuthRedirect(to.path, to.query);

  if (decision.shouldRedirect && decision.redirectTo) {
    return navigateTo(decision.redirectTo, { replace: true });
  }
});
```

The policy lives in a plain function in `@/utils/` that takes a path and returns a decision object — `{ shouldRedirect, redirectTo?, reason? }`. The `reason` names which rule fired.

- Authentication state also changes _without_ navigating — a session expiring, a logout in another tab. Watch auth state and re-run the same policy function, keeping one policy instead of two that drift.
- Route lists (guest-only, shared, protected) live in the policy function as data.

Use `{ replace: true }` on redirects so a guarded page does not sit in history for the back button to return to.

## Global vs named middleware

Global middleware (`middleware/*.global.ts`) runs on every navigation — right for authentication, which must not be forgotten on a new page. Named middleware, opted into via `definePageMeta`, is right for anything narrower. **Prefer global for security-relevant checks.**

## Priming the session

Baseline only — the `ssr` addon supersedes this section (`addons/ssr.md`, Cookie-session auth under SSR).

Under `ssr: false` the app boots with no server-rendered state, so anything the first render depends on is fetched by a plugin before the app mounts: prime the CSRF cookie, then attempt to rehydrate the user from the session cookie, treating failure as "not logged in" rather than an error.

## Navigation

- `navigateTo` for programmatic navigation, `<NuxtLink>` in templates. Never `window.location` — it discards the SPA's state and forces a full reload.
- External links use a plain `<a>` with `rel="noopener"`.
