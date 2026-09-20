# Nuxt Data Layer

**Layer:** Frontend
**Tool:** Pinia Colada · Zod

All API communication goes through two layers. Adding endpoints for a new resource means creating **both** files — a service file and a query file. Nothing in a component calls the network directly.

## 1. Service file — `@/services/<resource>.api.ts`

Pure async functions over `fetcher<T>()`, one per endpoint. Named `fetchItems` / `fetchItem`, `createItem`, `updateItem`, `deleteItem`.

- **No side effects beyond the HTTP call.** No store access, no toasts, no navigation, no cache writes.
- Every non-void response is **parsed, not asserted**: `parseResponse(Schema, await fetcher(url))`. Never `fetcher<T>()` with a type argument — that is a lie the compiler believes. Void endpoints (a `DELETE` returning 204) skip parsing.
- Response-only schemas — shapes used nowhere but this file — sit at the top of the service file. Domain schemas live with the types they produce in `@/types/` (`validation.md`).
- Unwrap envelopes here, not in components: an API that wraps single resources in `{ data: … }` gets `.data` applied at the service boundary so every consumer sees the model.

## 2. Query file — `@/services/queries/use<Resource>Queries.ts`

Named after the service file, one per service file. It holds three things:

**A query-key const.** Hierarchical keys for every query, declared `as const`. Queries only — mutations take no `key`: in Pinia Colada it is optional and exists solely for mutation-cache introspection, which nothing in this project uses.

```ts
export const USERS_ROOT = ['users'] as const;

export const usersQueryKeys = {
  fetchUsers: ['users', 'fetch'],
  fetchUser: ['users', 'get']
} as const;
```

**Each resource declares a root key beside its map, and mutations invalidate the root.** Invalidation matches a key and all its children, so one `invalidateQueries({ key: USERS_ROOT })` covers every query the resource has or will ever have. The alternative — each mutation listing the keys it affects — means every new query is a sweep through every existing mutation to find the ones that should now mention it, and the miss is silent: a stale list nobody invalidated.

Parameterized keys append their params in the composable: `key: () => [...usersQueryKeys.fetchUser, id.value]`.

**One composable per operation**, built on the project's `useAppQuery` / `useAppMutation` wrappers — **never raw `useQuery` / `useMutation`**, because the wrappers are where central error handling attaches (`error-handling.md`). Reactive params come in as `Ref`s so the key can track them:

```ts
export function useFetchUser(
  id: Ref<number>,
  options: Omit<AppQueryOptions<User>, 'key' | 'query'> = {}
) {
  return useAppQuery<User>({
    key: () => [...usersQueryKeys.fetchUser, id.value],
    query: () => fetchUser(id.value),
    ...options
  });
}
```

**Cache invalidation in `onSettled`.** Mutations invalidate the resource root; components never patch cached lists by hand. A mutation composable also passes the caller's own `onSettled` through, and the two run in a fixed order — internal first, then the caller's — which is pinned once in an exported helper rather than rewritten per mutation:

```ts
export function chainOnSettled<TData, TVars, TError>(
  internal: OnSettled<TData, TVars, TError>,
  callerHook: OnSettled<TData, TVars, TError> | undefined
): OnSettled<TData, TVars, TError> {
  return async (data, error, vars, context) => {
    await internal(data, error, vars, context);
    await callerHook?.(data, error, vars, context);
  };
}
```

Both `await`s matter: without them a caller's hook can run against a cache that has not finished invalidating.

## The options passthrough

Every composable takes an `options` passthrough so a caller can add its own `onSuccess` / `onSettled`. Two rules make that safe:

1. **Spread the caller's options first, then declare the internal hook** — otherwise the caller silently overwrites the invalidation the composable exists to guarantee.
2. **Chain the caller's hook last, and await the internal work before it** — `await` the invalidation, then `await options.onSettled?.(data, error, vars, context)`. Without the first await, a caller reading the cache or a store from its own hook sees the state as it was before the composable updated it.

```ts
export function useUpdateUser(options: /* … */ = {}) {
  const queryCache = useQueryCache();

  return useAppMutation({
    mutation: ({ id, userData }) => updateUser(id, userData),
    ...options,
    onSettled: async (data, error, vars, context) => {
      await queryCache.invalidateQueries({ key: usersQueryKeys.fetchUsers });
      await queryCache.invalidateQueries({ key: [...usersQueryKeys.fetchUser, vars.id] });
      await options.onSettled?.(data, error, vars, context);
    }
  });
}
```

**Test the await, not just the order.** An internal hook whose effect is synchronous (`setUser(data)`) runs in order whether or not it is awaited, and an invalidation asserts the refetch was _sent_, not that it finished — so a composable-level spec passes with the `await` removed. Pin the guarantee once, against a deliberately slow internal hook. A project that chains through one small helper rather than hand-writing the chain per composable has exactly one place to pin it, and one place for the chain to be wrong.

**Store side effects belong to the query layer's internal hook**, not to services and not to components — syncing the authenticated user after a login is the composable's job.

## The wrappers

`@/composables/useAppQuery.ts` and `useAppMutation.ts` wrap Pinia Colada, add central error handling, and take an extra `errorHandling` option that callers use to opt out of toasts:

```ts
export type AppQueryOptions<T> = UseQueryOptions<T> & {
  errorHandling?: ErrorHandlingOptions;
};
```

Two details that are load-bearing:

- **`placeholderData: (prev) => prev`** on queries keeps the previous page's data visible while the next one loads, so switching pages or filters does not flash empty.
- **Guard the error-handling setup with `getCurrentInstance()`** so a composable called outside a component's setup does not crash on the watcher it would otherwise register.

Augment Pinia Colada's error type once, project-wide, so every `error` is typed as the fetcher's error rather than `unknown`:

```ts
declare module '@pinia/colada' {
  interface TypesConfig {
    defaultError: FetchError;
  }
}
```

## Pinia Colada semantics

What the library's surface actually means, so state is read and caches are managed correctly.

### Query state

A query exposes two orthogonal statuses — one about the **data**, one about the **request**:

- `status` (`'pending' | 'success' | 'error'`) describes the data: `pending` means no data has ever arrived. `data` and `error` are its companions.
- `asyncStatus` (`'idle' | 'loading'`) describes the request: `loading` means a fetch is in flight right now, including background refetches.

The derived flags follow from that split: `isPending` (no data yet — first load) vs `isLoading` (a request is running — any load). A first-visit skeleton keys off `isPending`; a background-refresh indicator keys off `isLoading`. Because the wrappers set `placeholderData`, a query showing the previous page's data is `success` with `isPlaceholderData: true` — check that flag when stale-but-visible needs different treatment.

For TypeScript narrowing, read through the grouped `state` object: inside `state.status === 'error'` the type of `state.error` excludes `null`, and in the success branch `state.data` excludes `undefined`.

### Freshness and refetching

- A query is **stale** once `staleTime` (default 5 s) has passed since its last fetch. Stale queries refetch automatically when a component mounts them or their key changes; fresh ones are served from cache.
- `refresh()` fetches **only if stale** — prefer it. `refetch()` fetches unconditionally — reserve it for an explicit "reload" affordance.
- `gcTime` (default 5 min) is how long an **unused** entry stays cached after the last component unmounts it. Override either per query only with a reason (e.g. long `staleTime` for near-static reference data).

### Dependent queries

When a query's params aren't available yet (route not resolved, parent query still pending), pass a reactive `enabled` instead of guarding at the call site: `enabled: () => id.value != null`. A disabled query holds `pending` and fires as soon as the condition turns true.

**`enabled` carries authorization too, not only parameter readiness.** A user-scoped query is enabled on the session being _resolved and authenticated_, and that condition is declared **in the composable**, so no caller can forget it:

```ts
enabled: () => session.status.value === 'signed-in' && id.value != null;
```

This is where a three-state session earns its keep (`client-state.md`): with only a boolean, "not signed in" and "not known yet" are the same value, so the query either fires before the session resolves and 401s, or is suppressed for a user who turns out to be signed in. `unknown` keeps "not yet" distinct from "no".

### Invalidation semantics

`invalidateQueries({ key })` matches the key **and all its children** — `['users']` hits `['users', 'fetch']` and every `['users', 'get', id]`. Pass `exact: true` to match a single entry. Invalidation marks matching entries stale and refetches the **active** ones (currently mounted); inactive entries refetch when next used. That is why mutations can invalidate broadly without triggering a request storm.

**An identity change is eviction, not invalidation.** When a session ends, invalidating user-scoped queries is not enough: the wrappers set `placeholderData`, so an invalidated entry keeps showing the previous data while it refetches — the outgoing user's data, on screen, to whoever is there now. The entries have to be cancelled and removed. The query layer names its user-scoped roots in one place and clears them together:

```ts
const USER_SCOPED_ROOTS = [USERS_ROOT, meQueryKeys.fetchMe];

export function clearUserScopedCache(pinia?: Pinia): void {
  const queryCache = useQueryCache(pinia);

  for (const key of USER_SCOPED_ROOTS) {
    for (const entry of queryCache.getEntries({ key })) {
      queryCache.cancel(entry);
      queryCache.remove(entry);
    }
  }
}
```

**Cancel before remove**, or an in-flight request lands after the removal and repopulates what was just cleared. The **optional `pinia` argument** is not decoration: the trigger is a plugin or an auth SDK subscription that outlives component setup, where the active Pinia instance cannot be inferred and has to be passed.

### Mutation state and cache writes

- `mutate` catches the mutation's error itself (it lands in `error` and the central handler); `mutateAsync` also **rethrows**, so an un-caught `mutateAsync` call is an unhandled rejection — another reason the component rules default to `mutate`.
- A mutation exposes `isLoading`, `error`, `data`, and `reset()` (clears error and data back to the initial state — useful when a dialog reopens).
- The cache is directly writable — `queryCache.getQueryData(key)` / `setQueryData(key, data)` — which is how optimistic updates are built. The project's default is **invalidation, not manual cache writes**; reach for `setQueryData` only deliberately, and never from a component (the query layer owns the cache).

## Component rules

- Import query composables explicitly from `@/services/queries/…` and consume their state: `data`, `error`, and `isLoading` / `asyncStatus` for spinners and disabled buttons. **Never add a manual `ref()` loading flag.**
- **No try-catch around queries and mutations.** Errors are handled centrally. Opt out of the toast per call with `errorHandling: { suppressToasts: 'all' }`.
- Success toasts, navigation, and closing dialogs go in the page-level `onSuccess` passed to the composable.
- Trigger mutations with `mutate` (fire-and-forget) rather than `mutateAsync`, unless the result is needed inline.
- **"Do X only after the save succeeds" is a second named mutation with its own `onSuccess`** — never `mutateAsync` in a `try`/`catch` in a component. Sequencing two operations by awaiting one and calling the other puts the ordering, the failure handling, and the rollback question inside a component, which is where none of them belong.
