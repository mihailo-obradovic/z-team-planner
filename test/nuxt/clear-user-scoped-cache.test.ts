import { mountSuspended } from '@nuxt/test-utils/runtime';
import { useQuery, useQueryCache } from '@pinia/colada';
import { getActivePinia } from 'pinia';
import { defineComponent, h, nextTick } from 'vue';
import { describe, expect, it, vi } from 'vitest';

import { clearUserScopedCache } from '@/services/queries/clearUserScopedCache';
import { meQueryKeys } from '@/services/queries/useMeQueries';

import type { Pinia } from 'pinia';

const BUILD_LIST = { items: [{ id: 'b1', name: 'Cloud build' }], total: 1 };
const ME = {
  display_name: 'Alice',
  email: 'a@b.c',
  created_at: '',
  build_count: 1
};

describe('clearUserScopedCache', () => {
  it('drops the signed-in user’s cached builds and profile', async () => {
    let pinia: Pinia | undefined;
    let cache: ReturnType<typeof useQueryCache> | undefined;

    // * Both the cache and the Pinia instance are captured from inside a setup, because that is
    // * the only place either is resolvable — mirroring the plugin, which hands the instance over.
    await mountSuspended(
      defineComponent({
        setup() {
          pinia = getActivePinia();
          cache = useQueryCache();

          cache.setQueryData(['builds', 'fetch'], BUILD_LIST);
          cache.setQueryData(['builds', 'get', 'b1'], BUILD_LIST.items[0]);
          cache.setQueryData(meQueryKeys.fetchMe, ME);

          return () => h('div');
        }
      })
    );

    // * Non-vacuous: there is something to clear before it is cleared.
    expect(cache!.getEntries({ key: ['builds'] }).length).toBeGreaterThan(0);
    expect(cache!.getEntries({ key: meQueryKeys.fetchMe })).toHaveLength(1);

    clearUserScopedCache(pinia);

    // ! The defect this pins: sign-out only flipped the store, which disables the queries but
    // ! leaves their data in place — and `useAppQuery` holds previous data on purpose. The header
    // ! went on listing the last account's builds, visible to the next person on the browser.
    expect(cache!.getEntries({ key: ['builds'] })).toHaveLength(0);
    expect(cache!.getEntries({ key: meQueryKeys.fetchMe })).toHaveLength(0);
  });

  it('empties a mounted list in place, so a save after the next sign-in still reaches it', async () => {
    let pinia: Pinia | undefined;
    let cache: ReturnType<typeof useQueryCache> | undefined;
    const server = { items: [{ id: 'b1', name: 'Cloud build' }], total: 1 };

    const page = await mountSuspended(
      defineComponent({
        setup() {
          pinia = getActivePinia();
          cache = useQueryCache();
          const { data } = useQuery({
            key: ['builds', 'fetch'],
            query: async () => structuredClone(server)
          });

          return () =>
            h(
              'ul',
              (data.value?.items ?? []).map((item) => h('li', item.name))
            );
        }
      })
    );

    await vi.waitFor(() => expect(page.text()).toBe('Cloud build'));

    clearUserScopedCache(pinia);
    await nextTick();

    // * The outgoing account's list leaves the screen at once, as eviction requires.
    expect(page.text()).toBe('');

    server.items.push({ id: 'b2', name: 'Saved later' });
    server.total = 2;
    await cache!.invalidateQueries({ key: ['builds'] });

    // ! The defect this pins: removing an entry a mounted query still holds orphans it — the query
    // ! keeps the removed object, a later invalidation finds nothing in the cache to refetch, and
    // ! the build menu went on listing the builds from before the save until a reload.
    await vi.waitFor(() => expect(page.text()).toBe('Cloud buildSaved later'));
  });
});
