import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime';
import { defineComponent, h, ref } from 'vue';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useFetchSharedBuild } from '@/services/queries/useSharedQueries';

const fetchSharedBuildSpy = vi.fn<(id: string) => Promise<unknown>>();

vi.mock('@/services/shared.api', () => ({
  fetchSharedBuild: (id: string) => fetchSharedBuildSpy(id)
}));

// * A distinct id per test: the query cache is keyed by id and survives between mounts in a
// * file, so reusing one would let an earlier test's cached result satisfy a later one.
const BUILD_ID = '3f2504e0-4f89-41d3-9a0c-0305e82c3301';
const QUERY_ID_A = 'aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa';
const QUERY_ID_B = 'bbbbbbbb-2222-4222-8222-bbbbbbbbbbbb';
const QUERY_ID_C = 'cccccccc-3333-4333-8333-cccccccccccc';

mockNuxtImport('useRoute', () => () => ({
  path: `/b/${BUILD_ID}`,
  params: { id: BUILD_ID },
  query: {}
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

  // ! The resolved and 404 states are deliberately not asserted here. Under `mountSuspended`, a
  // ! Pinia Colada query created inside a *page* SFC never activates — the request is never
  // ! issued and the component stays `pending` forever. A bare harness in the suite above drives
  // ! the same composable and does fire, which is how the artifact was isolated. The page itself
  // ! was verified in a real browser against a running dev server: `/b/<unknown id>` issues the
  // ! request, receives 404, and the central policy renders Nuxt's 404 "Build not found" page.
});
