# Nuxt Client State

**Layer:** Frontend
**Tool:** Pinia

Pinia holds **client state** — what the app knows that no server owns. Server state belongs to Pinia Colada (`data-layer.md`), and the line between them is the first thing to get right: a store that caches server data has just built a second, worse cache with no invalidation.

## What belongs in a store

A store is for state that is **shared across components and outlives any one of them**:

- The authenticated user's identity and derived permissions.
- App-wide UI state — theme, sidebar open, a global toast queue.
- A multi-step flow's accumulated input, while the flow is in progress.

What does not:

- **Anything the API owns.** A user list, a resource being edited, a paginated table — that is Pinia Colada's, and it already handles caching, revalidation, and invalidation.
- **State one component uses.** A plain `ref` in that component is the right answer; a store is not tidier, it is just wider.
- **State shared by exactly two adjacent components.** Lift it to the parent first. Reach for a store when lifting stops being reasonable.

The one deliberate exception is a **form draft**: an explicit local copy of server-owned data, held as client state until submit — the exception the Universal Rules (Client And UI) name.

## Store shape

Setup syntax, not options syntax — it reads like the rest of a `<script setup>` codebase and types itself without helpers:

```ts
export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null);

  const isLoggedIn = computed(() => !!user.value);
  const isAdmin = computed(() => user.value?.role === 'admin');

  function setUser(value: User) {
    user.value = value;
  }

  function resetUser() {
    user.value = null;
  }

  // State is returned readonly: mutation goes through the actions above.
  return { user: readonly(user), isLoggedIn, isAdmin, setUser, resetUser };
});
```

Three rules the shape encodes:

- **Return state as `readonly()`.** Actions are the only mutation path.
- **Derive with `computed`, never store what you can derive.**
- **Actions are plain functions** and stay synchronous where they can. See below for the async case.

## Consuming a store

`storeToRefs()` for state and getters, plain destructuring for actions — the split matters because `storeToRefs` preserves reactivity for the first group, and actions do not need it:

```ts
const { user, isAdmin } = storeToRefs(useAuthStore());
const { setUser, resetUser } = useAuthStore();
```

Never wrap a store value in a local property that only re-exposes it (`const currentUser = computed(() => authStore.user)`) — it adds a name, a layer, and nothing else. Section 11 of `../_vue/vue-style.md` fixes where this sits in the script.

## Stores do not call the API

A store action does not fetch. The query layer calls the service, then calls the store action with the result (`data-layer.md` — "store side effects belong to the query layer's internal hook"). A store never has a loading state, an error state, or a retry — Pinia Colada owns those.

Where a store genuinely must trigger a fetch — priming the session at startup — that lives in a plugin that calls the service and hands the result to the action, not in the action itself (`routing.md`).

## File layout

One store per file in `@/stores/`, named `use<Domain>Store.ts` and exporting `use<Domain>Store`. The Pinia id (`defineStore('auth', …)`) matches the domain, not the filename.

Under Nuxt with `@pinia/nuxt`, `defineStore` and the store composables are auto-imported — do not import them explicitly (`../_vue/vue-style.md`, auto-import boundary).

## Persistence

A store is memory; a reload empties it. Anything that must survive one is written deliberately to a cookie or storage and read back on startup — `useCookie` where the value may ever need to be readable server-side (the theme is the usual case, see the vuetify `ui/` choice). Do not reach for a blanket persistence plugin.
