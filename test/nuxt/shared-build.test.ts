import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime';
import { defineComponent, h, ref } from 'vue';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useSharedBuild } from '@/composables/build/useSharedBuild';
import { useFetchSharedBuild } from '@/services/queries/useSharedQueries';

const fetchSharedBuildSpy = vi.fn<(id: string) => Promise<unknown>>();
const showErrorSpy = vi.fn<(error: unknown) => void>();
const toastSpy = vi.fn<(toast: unknown) => void>();

vi.mock('@/services/shared.api', () => ({
  fetchSharedBuild: (id: string) => fetchSharedBuildSpy(id)
}));

// * A distinct id per test: the query cache is keyed by id and survives between mounts in a file, so reusing one would let an earlier test's cached result satisfy a later one.
const BUILD_ID = '3f2504e0-4f89-41d3-9a0c-0305e82c3301';
const QUERY_ID_A = 'aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa';
const QUERY_ID_B = 'bbbbbbbb-2222-4222-8222-bbbbbbbbbbbb';
const QUERY_ID_C = 'cccccccc-3333-4333-8333-cccccccccccc';
const FAILED_ID_A = 'dddddddd-4444-4444-8444-dddddddddddd';
const FAILED_ID_B = 'eeeeeeee-5555-4555-8555-eeeeeeeeeeee';
const FAILED_ID_C = 'ffffffff-6666-4666-8666-ffffffffffff';
const FAILED_ID_D = '11111111-7777-4777-8777-111111111111';
const FAILED_ID_E = '22222222-8888-4888-8888-222222222222';

mockNuxtImport('useRoute', () => () => ({
  path: `/b/${BUILD_ID}`,
  params: { id: BUILD_ID },
  query: {}
}));

mockNuxtImport('showError', () => (error: unknown) => {
  showErrorSpy(error);
});

mockNuxtImport('useToast', () => () => ({
  add: (toast: unknown) => {
    toastSpy(toast);
  }
}));

const SharedBuildPage = (await import('@/pages/b/[id].vue')).default;

const PUBLIC_BUILD = {
  id: BUILD_ID,
  name: 'Shared main',
  data: { v: 1 as const },
  updated_at: '2026-08-26T08:00:00Z'
};

function harness(setup: () => unknown) {
  return defineComponent({
    setup() {
      setup();

      return () => h('div');
    }
  });
}

describe('the shared-build query', () => {
  beforeEach(() => {
    fetchSharedBuildSpy.mockReset();
    fetchSharedBuildSpy.mockResolvedValue(PUBLIC_BUILD);
  });

  it('fetches by id with no signed-in user', async () => {
    // ! No `enabled` gate, unlike every /builds query: a share link has to work signed out.
    await mountSuspended(harness(() => useFetchSharedBuild(ref(QUERY_ID_A))));

    await vi.waitFor(() =>
      expect(fetchSharedBuildSpy).toHaveBeenCalledWith(QUERY_ID_A)
    );
  });

  it('refetches when the id changes', async () => {
    const id = ref(QUERY_ID_B);

    await mountSuspended(harness(() => useFetchSharedBuild(id)));
    await vi.waitFor(() =>
      expect(fetchSharedBuildSpy).toHaveBeenCalledTimes(1)
    );

    id.value = QUERY_ID_C;

    await vi.waitFor(() =>
      expect(fetchSharedBuildSpy).toHaveBeenCalledWith(QUERY_ID_C)
    );
  });
});

describe('a shared read that fails', () => {
  beforeEach(() => {
    fetchSharedBuildSpy.mockReset();
    showErrorSpy.mockReset();
    toastSpy.mockReset();
  });

  function apiFailure(statusCode: number, message: string) {
    return { statusCode, data: { error: { code: 'x', message } } };
  }

  function raisedError() {
    return showErrorSpy.mock.calls[0]?.[0] as {
      statusCode?: number;
      fatal?: boolean;
      data?: { heading?: string };
    };
  }

  it('raises the error page with the status it failed with', async () => {
    fetchSharedBuildSpy.mockRejectedValue(apiFailure(503, 'Unavailable.'));

    await mountSuspended(harness(() => useSharedBuild(ref(FAILED_ID_A))));

    await vi.waitFor(() => expect(showErrorSpy).toHaveBeenCalledOnce());
    expect(raisedError().statusCode).toBe(503);
    expect(raisedError().fatal).toBe(true);
    // * No opted-in heading, so the page uses its own "Something went wrong" (feature 009).
    expect(raisedError().data?.heading).toBeUndefined();
  });

  it('never toasts, because the page is the message', async () => {
    fetchSharedBuildSpy.mockRejectedValue(
      apiFailure(429, 'Too many requests. Please try again in a minute.')
    );

    await mountSuspended(harness(() => useSharedBuild(ref(FAILED_ID_B))));

    await vi.waitFor(() => expect(showErrorSpy).toHaveBeenCalledOnce());
    expect(toastSpy).not.toHaveBeenCalled();
  });

  it('raises for a read that never got an answer', async () => {
    fetchSharedBuildSpy.mockRejectedValue(new TypeError('Failed to fetch'));

    await mountSuspended(harness(() => useSharedBuild(ref(FAILED_ID_C))));

    await vi.waitFor(() => expect(showErrorSpy).toHaveBeenCalledOnce());
    expect(raisedError().data?.heading).toBeUndefined();
  });

  it('leaves a dead share link to the central policy', async () => {
    fetchSharedBuildSpy.mockRejectedValue(apiFailure(404, 'Build not found.'));

    await mountSuspended(harness(() => useSharedBuild(ref(FAILED_ID_D))));

    await vi.waitFor(() => expect(showErrorSpy).toHaveBeenCalled());
    // ! Once, and with the heading: a second raise from here would replace "Build not found" with the generic wording.
    expect(showErrorSpy).toHaveBeenCalledOnce();
    expect(raisedError().statusCode).toBe(404);
    expect(raisedError().data?.heading).toBe('Build not found');
  });

  it('keeps a build that is already on screen when a later read fails', async () => {
    fetchSharedBuildSpy.mockResolvedValueOnce({
      ...PUBLIC_BUILD,
      id: FAILED_ID_E
    });

    let query: ReturnType<typeof useSharedBuild> | undefined;

    await mountSuspended(
      harness(() => {
        query = useSharedBuild(ref(FAILED_ID_E));
      })
    );
    await vi.waitFor(() => expect(query?.data.value?.id).toBe(FAILED_ID_E));

    fetchSharedBuildSpy.mockRejectedValue(apiFailure(503, 'Unavailable.'));
    await query?.refetch().catch(() => {});

    await vi.waitFor(() => expect(query?.error.value).toBeTruthy());
    expect(showErrorSpy).not.toHaveBeenCalled();
    expect(query?.data.value?.id).toBe(FAILED_ID_E);
  });
});

describe('/b/[id] page', () => {
  beforeEach(() => {
    fetchSharedBuildSpy.mockReset();
  });

  it('shows a skeleton while the build is pending', async () => {
    // * Never resolves, so the pending state is pinned rather than raced.
    fetchSharedBuildSpy.mockImplementation(() => new Promise(() => {}));

    const page = await mountSuspended(SharedBuildPage);

    expect(page.html()).toContain('animate-pulse');
  });

  // ! The resolved and 404 states are deliberately not asserted here. Under `mountSuspended`, a Pinia Colada query created inside a *page* SFC never activates — the request is never issued and the component stays `pending` forever. A bare harness in the suite above drives the same composable and does fire, which is how the artifact was isolated. The page itself was verified in a real browser against a running dev server: `/b/<unknown id>` issues the request, receives 404, and the central policy renders Nuxt's 404 "Build not found" page.
});
