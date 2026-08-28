export type FetcherOptions = Parameters<typeof $fetch>[1];

// * Deviation from stacks/frontend/nuxt/error-handling.md, which writes this as `error instanceof FetchError`: `ofetch` is not a declared dependency of this project, only a transitive one through Nuxt, so importing it here would be relying on hoisting. Reading the status is also robust to ofetch changing which error class it throws.
function isUnauthorized(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    (error as { statusCode?: number }).statusCode === 401
  );
}

const REQUEST_ID_HEADER = 'X-Request-ID';

// * Mirrors the API's own generated id (12 hex chars) so a client-side id is indistinguishable from a server-side one when grepping logs.
function generateRequestId(): string {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);

  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join(
    ''
  );
}

async function buildHeaders(
  forceRefresh: boolean
): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    [REQUEST_ID_HEADER]: generateRequestId()
  };

  const { $firebaseAuth } = useNuxtApp();
  const user = $firebaseAuth?.currentUser;

  if (user) {
    // * forceRefresh mints a new token rather than returning the cached one; that is the whole point of the retry below.
    headers.Authorization = `Bearer ${await user.getIdToken(forceRefresh)}`;
  }

  return headers;
}

async function makeRequest(
  path: string,
  options: FetcherOptions,
  forceRefresh = false
): Promise<unknown> {
  const { apiBaseUrl } = useRuntimeConfig().public;

  return await $fetch(path, {
    baseURL: apiBaseUrl,
    // ! No cookies. This API is bearer-token only and sets none; sending credentials would also force a CORS configuration the server deliberately refuses (feature 004).
    credentials: 'omit',
    ...options,
    headers: {
      ...(await buildHeaders(forceRefresh)),
      ...options?.headers
    }
  });
}

// * The one way this app talks to its API.
// * An expired ID token is recoverable, so a `401` refreshes the token and retries — exactly once. A second `401` is a real authentication failure and is thrown for the central policy to handle.
// * Returns `unknown` on purpose: a type argument here would be an assertion the compiler believes and nothing verifies. Services parse the result with Zod instead.
export async function fetcher(
  path: string,
  options: FetcherOptions = {}
): Promise<unknown> {
  try {
    return await makeRequest(path, options);
  } catch (error) {
    if (isUnauthorized(error)) {
      // ! Retries through makeRequest, never through fetcher: recursing would turn a persistently rejected token into an infinite loop of refresh attempts.
      return await makeRequest(path, options, true);
    }

    throw error;
  }
}
