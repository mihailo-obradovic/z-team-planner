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

**The fetcher returns `unknown`.** It has not validated anything, so it has nothing to claim about the shape. The type appears where the Zod parse happens, at the service function (`data-layer.md`), and a generic on the fetcher would only let a caller assert past the one place that checks.

Some failures are **recoverable without the user knowing** — a credential the API expires independently of the session. The shape is the same whatever the status: refresh the credential, retry exactly once, and guard against recursion.

```ts
export async function fetcher(
  path: string,
  params: FetcherOptions = {}
): Promise<unknown> {
  try {
    return await makeRequest(path, params);
  } catch (error) {
    // An expired CSRF token is recoverable: refresh the cookie and retry once.
    if (
      error instanceof FetchError &&
      error.statusCode === 419 &&
      path !== CSRF_COOKIE_PATH
    ) {
      await makeRequest(CSRF_COOKIE_PATH, {});
      return makeRequest(path, params);
    }
    throw error;
  }
}
```

Two details are load-bearing and easy to lose in a refactor:

- **The retry calls `makeRequest`, not `fetcher`** — so it retries exactly once. Calling `fetcher` recursively turns a persistently failing token into an infinite loop.
- **The `path !== CSRF_COOKIE_PATH` guard** stops the cookie endpoint itself from triggering a refresh of the cookie endpoint.

`419` is the status a Laravel API uses for this; an API that signals an expired credential differently substitutes its own code, and an API with no such credential drops the retry entirely. The shape above is what transfers, not the number.

## The central policy — `@/utils/handleApiError.ts`

Every failed request lands here. It decides navigation and messaging in one place — and it is a **pure function**: it imports nothing from Nuxt, and every effect it can cause arrives in one injected context object.

```ts
export function handleApiError(
  error: unknown,
  context: ErrorContext,
  options: ErrorHandling = {}
): void;
```

`ErrorContext` carries the effects — resetting the session, showing a toast, navigating, raising a fatal page — as plain functions, and a **thin framework-aware watcher** builds it from the composables that actually know how. That split is the whole point: the policy is the part with the branching, so it is the part worth unit-testing, and a function that calls `useRouter` cannot be tested without mounting something.

**The deduplication `WeakSet` lives inside the policy**, not in the watcher. A query used by several components attaches a watcher per component to the same error object, and dedup in the watcher only covers the entry point it was written for — inside the policy, every caller gets it.

| Status        | Action                                                                          |
| ------------- | ------------------------------------------------------------------------------- |
| **401**       | Clear the local user; the `isLoggedIn` watcher redirects via the routing logic  |
| **403**       | Redirect to the authenticated landing route — unless already there              |
| **422**       | Surface every field message rather than the API's "(and N more errors)" summary |
| anything else | One toast carrying the API's message                                            |

The 401 row is why a session store has **one writer and one documented exception**: this policy is the exception. A folder document stating that invariant reconciles it against this row rather than inventing it (`references/folder-documents.md`).

**That table is a worked default for a cookie-session API, not a fixed rule** — it is the project's own policy, and it changes with the app's shape. A 401 redirects nowhere in an app with no protected routes, and a 403 has no authenticated landing route to fall back to. Write the table the app needs; what does not change is that it exists in one place.

**Opt-outs** are per call, passed through the query composable's `errorHandling` option, whose one key is `suppressToasts`:

- `'validation'` — 422s only; the form shows them inline (`validation.md`). Every other status still toasts.
- `'all'` — every toast for that call; the caller renders the failure itself.

One key with named values rather than a boolean per status: two independent flags make `{ hideToast: true, hideValidationToast: false }` type-check while meaning nothing, and the legal states are three, not four.

## Deduplicating handled errors

Track handled errors in a **`WeakSet`** inside the policy and handle each object once:

```ts
const handledErrors = new WeakSet<object>();

export function handleApiError(error, context, options = {}) {
  if (typeof error !== 'object' || error === null) return;
  if (handledErrors.has(error)) return;
  handledErrors.add(error);
  // …the policy
}
```

A `WeakSet` specifically — the entry disappears with the error object, so a long session accumulates nothing.

## When the failure was the page

A toast is right for a failure beside working content. It is wrong when **the failed request _was_ the page** — a toast over an empty layout tells the user something broke and leaves them looking at nothing. That case is a page-level outcome, and the policy raises it instead of toasting:

```ts
showError(
  createError({
    fatal: true,
    data: { heading: 'This build could not be loaded' }
  })
);
```

- **The project owns a single `error.vue`**, covering every fatal error the app can raise. Nuxt renders it in place of the whole app.
- **The raising site passes its wording through `data`.** Only the caller knows what failed; `error.vue` renders what it is handed rather than mapping status codes to sentences it has to keep in step.
- **Never render `statusMessage`.** Nuxt writes `Page not found: <path>` into it, so it reflects attacker-supplied path text straight back onto the page. Render `data`, and a generic fallback where there is none.
- **`clearError`** is how the page offers a way back — it drops the error state and navigates, rather than reloading the app.

**`error.vue` is independent of the shell.** It renders when the app is broken, possibly before anything is ready, so it reads no shell state, mounts no client-only components, and makes no network call. Anything it needs is in the error object it was handed. Its height comes from the layout chain like any other page (`page-layout.md`).

## Getting a usable message out of a failure

`ofetch` throws with a `.message` describing the _request_ (`[POST] "/login": 422 Unprocessable Content`) — never the message the API wrote. The API's message is on the parsed body. Read them in order:

1. `error.data.message` — what the API actually said.
2. `error.message` — the transport-level description.
3. A generic fallback: _"Something went wrong. Please try again."_

Only the first is worth showing a user; the other two exist so no failure is silent.

## Schema failures are not user errors

`parseResponse` (`data-layer.md`) throwing means the API changed shape or the schema is wrong. Log the parse issue for a developer and throw a generic message — a user cannot act on a Zod issue path, and it should not be in their toast.

**The same principle has a second entry point with a different answer: a parser called inside a `computed`.** A `computed` that throws does not surface as a handled error — it propagates through the render and unmounts the component, so a schema mismatch in one card blanks the page. A parse at that boundary returns `null` and logs the developer error instead of throwing, and the template treats `null` as the empty state it already has.
