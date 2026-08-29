# Nuxt Fetcher & Error Handling

**Layer:** Frontend
**Tool:** ofetch · Pinia Colada

One fetcher wraps every request; one policy handles every failure. Components contain no try-catch, and no component decides what a 401 means.

## The fetcher — `@/utils/fetcher.ts`

A single wrapper over `$fetch` that every service function calls (`data-layer.md`). It owns four things no caller should repeat:

- **`Accept: application/json`** on every request, so an API that would otherwise redirect or render HTML answers with JSON it can parse.
- **`credentials: 'include'`**, for a cookie-session API on another origin.
- **The base URL**, read from public runtime config — the Universal Rules' injection rule bound to Nuxt.
- **The CSRF header** (`X-XSRF-TOKEN`, read from the CSRF cookie) on mutating verbs only — `POST`, `PUT`, `PATCH`, `DELETE`. Sending it on reads is harmless but noise.

### The CSRF retry

A cookie-session API expires its CSRF token independently of the session. An expired token is recoverable and must never reach the user:

```ts
export async function fetcher<T>(
  path: string,
  params: FetcherOptions = {}
): Promise<T> {
  try {
    return await makeRequest<T>(path, params);
  } catch (error) {
    // An expired CSRF token is recoverable: refresh the cookie and retry once.
    if (
      error instanceof FetchError &&
      error.statusCode === 419 &&
      path !== CSRF_COOKIE_PATH
    ) {
      await makeRequest(CSRF_COOKIE_PATH, {});
      return makeRequest<T>(path, params);
    }
    throw error;
  }
}
```

Two details are load-bearing and easy to lose in a refactor:

- **The retry calls `makeRequest`, not `fetcher`** — so it retries exactly once. Calling `fetcher` recursively turns a persistently failing token into an infinite loop.
- **The `path !== CSRF_COOKIE_PATH` guard** stops the cookie endpoint itself from triggering a refresh of the cookie endpoint.

`419` is the status a Laravel API uses for this; an API that signals an expired token differently substitutes its own code. Nothing else about the pattern changes.

## The central policy — `@/utils/handleApiError.ts`

Every failed request lands here. It decides navigation and messaging in one place:

| Status        | Action                                                                          |
| ------------- | ------------------------------------------------------------------------------- |
| **401**       | Clear the local user; the `isLoggedIn` watcher redirects via the routing logic  |
| **403**       | Redirect to the authenticated landing route — unless already there              |
| **422**       | Surface every field message rather than the API's "(and N more errors)" summary |
| anything else | One toast carrying the API's message                                            |

**Opt-outs** are per call, passed through the query composable's `errorHandling` option, whose one key is `suppressToasts`:

- `'validation'` — 422s only; the form shows them inline (`validation.md`). Every other status still toasts.
- `'all'` — every toast for that call; the caller renders the failure itself.

One key with named values rather than a boolean per status: two independent flags make `{ hideToast: true, hideValidationToast: false }` type-check while meaning nothing, and the legal states are three, not four.

## Deduplicating handled errors

A query used by several components attaches a watcher per component to the same error ref. Track handled errors in a **`WeakSet`** and handle each object once:

```ts
const handledErrors = new WeakSet<FetchError>();

watch(errorRef, (error) => {
  if (!error || handledErrors.has(error)) return;
  handledErrors.add(error);
  handleApiError(error, { routePath: route.path, resetUser }, errorHandling);
});
```

A `WeakSet` specifically — the entry disappears with the error object, so a long session accumulates nothing.

## Getting a usable message out of a failure

`ofetch` throws with a `.message` describing the _request_ (`[POST] "/login": 422 Unprocessable Content`) — never the message the API wrote. The API's message is on the parsed body. Read them in order:

1. `error.data.message` — what the API actually said.
2. `error.message` — the transport-level description.
3. A generic fallback: _"Something went wrong. Please try again."_

Only the first is worth showing a user; the other two exist so no failure is silent.

## Schema failures are not user errors

`parseResponse` (`data-layer.md`) throwing means the API changed shape or the schema is wrong. Log the parse issue for a developer and throw a generic message — a user cannot act on a Zod issue path, and it should not be in their toast.
