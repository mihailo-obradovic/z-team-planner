# Nuxt Client State

**Layer:** Frontend
**Tool:** Pinia · `useState`

**Client state** is what the app knows that no server owns, and it has three homes: `useState`, a shared composable, and a Pinia store. Server state belongs to Pinia Colada (`data-layer.md`), and the line between them is the first thing to get right: a store that caches server data has just built a second, worse cache with no invalidation.

## What belongs in a store

A store is for state that is **shared across components and outlives any one of them**:

- The authenticated user's identity and derived permissions.
- App-wide UI state — theme, sidebar open, a global toast queue.
- A multi-step flow's accumulated input, while the flow is in progress.

What does not:

- **Anything the API owns.** A user list, a resource being edited, a paginated table — that is Pinia Colada's, and it already handles caching, revalidation, and invalidation.
- **State one component uses.** A plain `ref` in that component is the right answer; a store is not tidier, it is just wider.
- **State shared by exactly two adjacent components.** Lift it to the parent first. Reach for a store when lifting stops being reasonable.

**There is a third option between the two, and it is the one most often wanted: `useState`.** A store and a local `ref` are not the only choices, and treating them as such pushes every shared flag into a store that has no business holding it.

| Reach for      | When                                                                                                                                       |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| a local `ref`  | One component owns it                                                                                                                      |
| **`useState`** | Shared, but the key is part of no public contract and it needs no actions, no getters, and no devtools story — a dialog's open flag, a tab |
| a Pinia store  | It needs a mutation discipline, derived getters, or to be read from outside a component                                                    |

A dozen `useState` keys beside one small store is a healthy shape, not a smell. The question is never "is this shared?" but **"does this need what a store provides?"**

`useState` is also what gives a composable a shared identity — see below.

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

Never wrap a store value in a local property that only re-exposes it (`const currentUser = computed(() => authStore.user)`) — it adds a name, a layer, and nothing else. Nor a local handle the members are then read off (`const authStore = useAuthStore()`, then `authStore.resetUser()`): that is the same layer without the name. The split binds **every file that consumes a store** — composables, plugins, and services as much as components. Section 11 of `../_vue/vue-style.md` fixes where it sits in an SFC's script.

## Composables

A composable is the third home for shared state, and it has four rules of its own.

- **Identity comes from `useState`, never a bare `ref`.** A `ref` declared inside a composable body is a **new instance per caller** — the first caller never notices, and the second one exposes it, usually as two components disagreeing about the same flag. A `ref` at module scope shares identity but leaks between requests on a server. `useState` with a key is the one form that is shared and request-safe.
- **The owning composable declares every key's initial value**, at its definition. A key initialised by whichever caller happens to run first has a value that depends on render order.
- **Composables that call each other declare a direction.** Write down which may call which and keep it acyclic; two composables that each reach for the other recurse the moment both are used on one page.
- **Return state read-only, exactly as a store does**, and let the owning module do the orchestration. A caller that mutates another module's state is a second writer to an invariant that module is responsible for; a sequence of callers each doing part of an operation means no single place can be read to know what the operation is.

## Stores do not call the API

A store action does not fetch. The query layer calls the service, then calls the store action with the result (`data-layer.md` — "store side effects belong to the query layer's internal hook"). A store never has a loading state, an error state, or a retry — Pinia Colada owns those.

Where a store genuinely must trigger a fetch — priming the session at startup — that lives in a plugin that calls the service and hands the result to the action, not in the action itself (`routing.md`).

**A plugin wiring an optional third-party capability never throws.** Absent configuration and a failed initialisation are both ordinary deployment states — a preview build without the keys, a service the project runs without. A plugin that throws on either takes the whole app down for a capability the app was designed to live without.

Instead: log once for a developer, record an **unavailable** state the UI already models, and provide `null` so every downstream consumer degrades on a single check rather than a try-catch each.

**Widen an existing state rather than add a flag.** A capability that is configured, unavailable, or ready is one state with three values; a separate `isAvailable` boolean beside it is a second source of truth whose only future is being deleted when someone notices they can disagree.

## File layout

One store per file in `@/stores/`, named `use<Domain>Store.ts` and exporting `use<Domain>Store`. The Pinia id (`defineStore('auth', …)`) matches the domain, not the filename.

Under Nuxt with `@pinia/nuxt`, `defineStore` and the store composables are auto-imported — do not import them explicitly (`../_vue/vue-style.md`, auto-import boundary).

## Persistence

A store is memory; a reload empties it. Anything that must survive one is written deliberately to a cookie or storage and read back on startup — `useCookie` where the value may ever need to be readable server-side (the theme is the usual case, see the vuetify `ui/` choice). Do not reach for a blanket persistence plugin.
