export type FetcherOptions = Parameters<typeof $fetch>[1];

// * Whether the request may reuse the SDK's cached ID token or must mint a new one.
export type TokenFreshness = 'cached-token' | 'fresh-token';

// * Deviation from stacks/frontend/nuxt/error-handling.md, which writes this as `error instanceof FetchError`: `ofetch` is only a transitive dependency here, so importing it would rely on hoisting.
function isUnauthorized(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    (error as { statusCode?: number }).statusCode === 401
  );
}

const REQUEST_ID_HEADER = 'X-Request-ID';

// * Twelve hex chars, matching the API's own generated id, so neither side is distinguishable when grepping logs.
function generateRequestId(): string {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);

  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join(
    ''
  );
}

async function buildHeaders(
  freshness: TokenFreshness
): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    [REQUEST_ID_HEADER]: generateRequestId()
  };

  const { $firebaseAuth } = useNuxtApp();
  const user = $firebaseAuth?.currentUser;

  if (user) {
    // * The SDK's own signature is a boolean, so the union converts here and nowhere else.
    const token = await user.getIdToken(freshness === 'fresh-token');

    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

async function makeRequest(
  path: string,
  options: FetcherOptions,
  freshness: TokenFreshness = 'cached-token'
): Promise<unknown> {
  const { apiBaseUrl } = useRuntimeConfig().public;

  return await $fetch(path, {
    baseURL: apiBaseUrl,
    // ! No cookies. This API is bearer-token only and sets none; sending credentials would also force a CORS configuration the server deliberately refuses (feature 004).
    credentials: 'omit',
    ...options,
    headers: {
      ...(await buildHeaders(freshness)),
      ...options?.headers
    }
  });
}

// * An expired ID token is recoverable, so a `401` refreshes and retries exactly once; a second one is a real authentication failure and goes to the central policy.
// * Returns `unknown` because a type argument here would be an assertion nothing verifies — services parse the result with Zod instead.
export async function fetcher(
  path: string,
  options: FetcherOptions = {}
): Promise<unknown> {
  try {
    return await makeRequest(path, options);
  } catch (error) {
    if (isUnauthorized(error)) {
      // ! Retries through makeRequest, never through fetcher: recursing would turn a persistently rejected token into an infinite loop of refresh attempts.
      return await makeRequest(path, options, 'fresh-token');
    }

    throw error;
  }
}
