import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime';
import { createPinia, setActivePinia } from 'pinia';
import { defineComponent, h, nextTick } from 'vue';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useAppMutation } from '@/composables/useAppMutation';
import { useAppQuery } from '@/composables/useAppQuery';
import { useApiErrorWatcher } from '@/composables/useApiErrorWatcher';

const toastAdd = vi.fn<(payload: { title: string; color: string }) => void>();

mockNuxtImport('useToast', () => () => ({ add: toastAdd }));

function harness(setup: () => unknown) {
  return defineComponent({
    setup() {
      const result = setup();

      return () => h('div', { 'data-testid': 'ready' }, String(!!result));
    }
  });
}

describe('useAppQuery / useAppMutation', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    toastAdd.mockReset();
  });

  it('keeps previous data visible across a key change', async () => {
    const page = ref(1);
    let query: ReturnType<typeof useAppQuery<string>> | undefined;

    await mountSuspended(
      harness(() => {
        query = useAppQuery<string>({
          key: () => ['page', page.value],
          query: async () => `data-${page.value}`
        });

        return query;
      })
    );

    await vi.waitFor(() => expect(query?.data.value).toBe('data-1'));

    page.value = 2;
    await nextTick();

    // * The old page is still on screen while the new one loads — that is placeholderData doing its job. Without it this reads undefined and the list flashes empty.
    expect(query?.data.value).toBe('data-1');

    await vi.waitFor(() => expect(query?.data.value).toBe('data-2'));
  });

  it('routes a failed query through the central policy', async () => {
    await mountSuspended(
      harness(() =>
        useAppQuery({
          key: ['boom'],
          query: async () => {
            throw Object.assign(new Error('nope'), {
              statusCode: 500,
              data: { error: { message: 'Server exploded' } }
            });
          }
        })
      )
    );

    await vi.waitFor(() => expect(toastAdd).toHaveBeenCalled());
    expect(toastAdd.mock.calls[0]?.[0]).toMatchObject({
      title: 'Server exploded',
      color: 'error'
    });
  });

  it('honours a toast opt-out', async () => {
    await mountSuspended(
      harness(() =>
        useAppQuery({
          key: ['quiet'],
          query: async () => {
            throw Object.assign(new Error('nope'), { statusCode: 500 });
          },
          errorHandling: { suppressToasts: 'all' }
        })
      )
    );

    await nextTick();
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(toastAdd).not.toHaveBeenCalled();
  });

  it('routes a failed mutation through the same policy', async () => {
    let mutate: (() => void) | undefined;

    await mountSuspended(
      harness(() => {
        const mutation = useAppMutation({
          mutation: async () => {
            throw Object.assign(new Error('nope'), {
              statusCode: 409,
              data: { error: { message: 'You can keep up to 20 builds' } }
            });
          }
        });
        mutate = () => mutation.mutate();

        return mutation;
      })
    );

    mutate?.();

    await vi.waitFor(() => expect(toastAdd).toHaveBeenCalled());
    expect(toastAdd.mock.calls[0]?.[0]).toMatchObject({
      title: 'You can keep up to 20 builds'
    });
  });

  it('does nothing when called outside a component setup', () => {
    // ! No owner to bind a watcher to; registering one anyway would leak it.
    expect(() => useApiErrorWatcher(ref<unknown>(null))).not.toThrow();
    expect(toastAdd).not.toHaveBeenCalled();
  });
});
