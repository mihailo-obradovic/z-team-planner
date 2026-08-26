import { mountSuspended } from '@nuxt/test-utils/runtime';
import { defineComponent, h, ref } from 'vue';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { chainOnSettled } from '@/services/queries/chainOnSettled';
import {
  buildsQueryKeys,
  useFetchBuilds
} from '@/services/queries/useBuildQueries';
import { meQueryKeys } from '@/services/queries/useMeQueries';
import { sharedQueryKeys } from '@/services/queries/useSharedQueries';
import { useAuthStore } from '@/stores/useAuthStore';

const fetchBuildsSpy = vi.fn<() => Promise<unknown>>();

vi.mock('@/services/builds.api', () => ({
  fetchBuilds: () => fetchBuildsSpy(),
  fetchBuild: vi.fn<() => Promise<never>>(),
  createBuild: vi.fn<() => Promise<never>>(),
  updateBuild: vi.fn<() => Promise<never>>(),
  deleteBuild: vi.fn<() => Promise<never>>(),
  importBuilds: vi.fn<() => Promise<never>>()
}));

function harness(setup: () => unknown) {
  return defineComponent({
    setup() {
      setup();

      return () => h('div');
    }
  });
}

describe('query keys', () => {
  it('match the keys feature 008 fixes', () => {
    // ! These are a contract: invalidation targets them by value, so a rename here silently
    // ! stops a list refreshing rather than failing loudly.
    expect(buildsQueryKeys.fetchBuilds).toEqual(['builds', 'fetch']);
    expect(buildsQueryKeys.fetchBuild).toEqual(['builds', 'get']);
    expect(sharedQueryKeys.fetchSharedBuild).toEqual(['shared', 'get']);
    expect(meQueryKeys.fetchMe).toEqual(['me']);
  });

  it('nests build keys under one root so a single invalidation covers both', () => {
    expect(buildsQueryKeys.fetchBuilds[0]).toBe('builds');
    expect(buildsQueryKeys.fetchBuild[0]).toBe('builds');
  });
});

describe('enabled gating', () => {
  beforeEach(() => {
    fetchBuildsSpy.mockReset();
    fetchBuildsSpy.mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      page_size: 20
    });
  });

  // ! The store must be touched inside the component's own setup: mountSuspended builds its
  // ! own Nuxt app with its own Pinia, so a setActivePinia() in the test body is a different
  // ! store entirely — and every gating assertion would pass for the wrong reason.
  async function mountWithAuth(
    prepare: (store: ReturnType<typeof useAuthStore>) => void
  ) {
    await mountSuspended(
      harness(() => {
        prepare(useAuthStore());

        return useFetchBuilds(ref(1));
      })
    );
    await new Promise((resolve) => setTimeout(resolve, 60));
  }

  it('makes no request while the store is unknown', async () => {
    await mountWithAuth((store) => {
      expect(store.status).toBe('unknown');
    });

    // * Feature 006, Examples: "load / signed out -> no API request at all".
    expect(fetchBuildsSpy).not.toHaveBeenCalled();
  });

  it('makes no request while anonymous', async () => {
    await mountWithAuth((store) => store.resetUser());

    expect(fetchBuildsSpy).not.toHaveBeenCalled();
  });

  it('fetches once signed in', async () => {
    await mountWithAuth((store) =>
      store.setUser({ uid: 'u1', email: null, displayName: 'Alice' })
    );

    expect(fetchBuildsSpy).toHaveBeenCalled();
  });
});

describe('chainOnSettled', () => {
  // * chainOnSettled just forwards the mutation context; these tests are about ordering.
  const NO_CONTEXT = {} as never;

  it('awaits the internal hook before the caller runs', async () => {
    const order: string[] = [];

    const chained = chainOnSettled(
      async () => {
        // ! A deliberately slow internal hook. Without the await, the caller's onSettled would
        // ! run first and a page would close its dialog while the list was still stale.
        await new Promise((resolve) => setTimeout(resolve, 30));
        order.push('invalidate');
      },
      async () => {
        order.push('caller');
      }
    );

    await chained(undefined, null, undefined, NO_CONTEXT);

    expect(order).toEqual(['invalidate', 'caller']);
  });

  it('runs the internal hook even when the caller passed none', async () => {
    const internal = vi.fn<() => Promise<void>>(async () => {});

    await chainOnSettled(internal, undefined)(
      undefined,
      null,
      undefined,
      NO_CONTEXT
    );

    expect(internal).toHaveBeenCalledOnce();
  });

  it('does not let the caller replace the internal hook', async () => {
    const internal = vi.fn<() => Promise<void>>(async () => {});
    const caller = vi.fn<() => Promise<void>>(async () => {});

    await chainOnSettled(internal, caller)(
      undefined,
      null,
      undefined,
      NO_CONTEXT
    );

    // * The options spread puts the caller's hooks in first; chaining is what keeps ours.
    expect(internal).toHaveBeenCalledOnce();
    expect(caller).toHaveBeenCalledOnce();
  });
});
