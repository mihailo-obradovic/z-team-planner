import { beforeEach, describe, expect, it, vi } from 'vitest';

type FetchCallOptions = {
  baseURL: string;
  credentials: string;
  headers: Record<string, string>;
};

// * Stubbed rather than imported: the fetcher reaches for Nuxt's auto-imported globals, and the unit project runs outside a Nuxt app.
const fetchMock =
  vi.fn<(path: string, options: FetchCallOptions) => Promise<unknown>>();
const getIdToken = vi.fn<(forceRefresh: boolean) => Promise<string>>();
const runtimeConfig = { public: { apiBaseUrl: 'https://api.test/api/v1' } };
let currentUser: { getIdToken: typeof getIdToken } | null = null;

vi.stubGlobal('$fetch', fetchMock);
vi.stubGlobal('useRuntimeConfig', () => runtimeConfig);
vi.stubGlobal('useNuxtApp', () => ({ $firebaseAuth: { currentUser } }));
vi.stubGlobal('crypto', globalThis.crypto);

const { fetcher } = await import('@/utils/fetcher');

// * Shaped like ofetch's FetchError, which carries `statusCode`. The fetcher reads that field rather than the class, so this is the same thing as far as the code under test is concerned.
function httpError(statusCode: number): Error & { statusCode: number } {
  return Object.assign(new Error(`${statusCode}`), { statusCode });
}

// * `noUncheckedIndexedAccess` types every `mock.calls[n]` as possibly absent. This asserts the call happened once, in one place, so a missing call fails as a readable test error rather than as a type error at each use.
function callArgs(index: number): [path: string, options: FetchCallOptions] {
  const call = fetchMock.mock.calls[index];

  if (!call) {
    throw new Error(`Expected $fetch to have been called at index ${index}`);
  }

  return call;
}

describe('fetcher', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    getIdToken.mockReset();
    currentUser = null;
  });

  it('sends the base URL, Accept and a request id, and omits credentials', async () => {
    fetchMock.mockResolvedValue({ ok: true });

    await fetcher('/builds');

    const [path, options] = callArgs(0);
    expect(path).toBe('/builds');
    expect(options.baseURL).toBe('https://api.test/api/v1');
    expect(options.credentials).toBe('omit');
    expect(options.headers.Accept).toBe('application/json');
    // * 12 hex chars, matching the id the API generates when none is sent.
    expect(options.headers['X-Request-ID']).toMatch(/^[0-9a-f]{12}$/);
  });

  it('gives each request its own id', async () => {
    fetchMock.mockResolvedValue({});

    await fetcher('/builds');
    await fetcher('/builds');

    const [first, second] = fetchMock.mock.calls.map(
      (call) => call[1].headers['X-Request-ID']
    );
    expect(first).not.toBe(second);
  });

  it('sends no Authorization header when signed out', async () => {
    fetchMock.mockResolvedValue({});

    await fetcher('/shared/abc');

    expect(callArgs(0)[1].headers.Authorization).toBeUndefined();
  });

  it('sends a bearer token when signed in', async () => {
    currentUser = { getIdToken };
    getIdToken.mockResolvedValue('token-1');
    fetchMock.mockResolvedValue({});

    await fetcher('/me');

    expect(getIdToken).toHaveBeenCalledWith(false);
    expect(callArgs(0)[1].headers.Authorization).toBe('Bearer token-1');
  });

  it('refreshes and retries once on 401, then succeeds', async () => {
    currentUser = { getIdToken };
    getIdToken.mockResolvedValueOnce('stale').mockResolvedValueOnce('fresh');
    fetchMock
      .mockRejectedValueOnce(httpError(401))
      .mockResolvedValueOnce({ ok: true });

    const result = await fetcher('/me');

    expect(result).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    // * The retry forces a new token; without `true` it would resend the same expired one.
    expect(getIdToken).toHaveBeenNthCalledWith(2, true);
    expect(callArgs(1)[1].headers.Authorization).toBe('Bearer fresh');
  });

  it('does not retry the retry', async () => {
    currentUser = { getIdToken };
    getIdToken.mockResolvedValue('token');
    fetchMock.mockRejectedValue(httpError(401));

    await expect(fetcher('/me')).rejects.toMatchObject({ statusCode: 401 });
    // ! Exactly two: the original and one retry. Recursion here would loop forever against a persistently rejected token.
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('does not retry any other status', async () => {
    const error = httpError(409);
    fetchMock.mockRejectedValue(error);

    await expect(fetcher('/builds')).rejects.toBe(error);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('lets caller headers win over the defaults', async () => {
    fetchMock.mockResolvedValue({});

    await fetcher('/builds', { headers: { 'Idempotency-Key': 'key-1' } });

    const { headers } = callArgs(0)[1];
    expect(headers['Idempotency-Key']).toBe('key-1');
    expect(headers.Accept).toBe('application/json');
  });
});
