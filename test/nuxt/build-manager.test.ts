import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime';
import { defineComponent, h } from 'vue';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import BuildManager from '@/components/_shared/BuildManager.vue';
import { useAuthStore } from '@/stores/useAuthStore';

const fetchBuildsSpy = vi.fn<() => Promise<unknown>>();
const fetchBuildSpy = vi.fn<(id: string) => Promise<unknown>>();

vi.mock('@/services/builds.api', () => ({
  fetchBuilds: () => fetchBuildsSpy(),
  fetchBuild: (id: string) => fetchBuildSpy(id),
  createBuild: vi.fn<() => Promise<never>>(),
  updateBuild: vi.fn<() => Promise<never>>(),
  deleteBuild: vi.fn<() => Promise<never>>(),
  importBuilds: vi.fn<() => Promise<never>>()
}));

mockNuxtImport('useRoute', () => () => ({ path: '/', params: {}, query: {} }));

const ACCOUNT_BUILDS = {
  items: [
    {
      id: 'aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa',
      name: 'Cloud build',
      format_version: 1,
      created_at: '2026-08-26T07:00:00Z',
      updated_at: '2026-08-26T08:00:00Z'
    }
  ],
  total: 1,
  page: 1,
  page_size: 20
};

// * BuildManager renders <u-tooltip>, which needs UApp's TooltipProvider. Stubbing the tooltip is enough here and keeps the mount shallow — these tests are about which requests the component triggers, not about tooltip behaviour.
const STUBS = {
  UTooltip: { template: '<div><slot /></div>' },
  UDropdownMenu: {
    name: 'UDropdownMenu',
    props: ['items'],
    template: '<div><slot /></div>'
  }
};

function signIn() {
  // ! Called inside a component setup, so it is the component's own Pinia. A store created in the test body is a different instance and every assertion here would be vacuous.
  useAuthStore().setUser({ uid: 'u1', email: null, displayName: 'Alice' });
}

describe('BuildManager account list', () => {
  beforeEach(() => {
    fetchBuildsSpy.mockReset();
    fetchBuildSpy.mockReset();
    fetchBuildsSpy.mockResolvedValue(ACCOUNT_BUILDS);
  });

  it('requests no account builds while signed out', async () => {
    const page = await mountSuspended(BuildManager, {
      global: { stubs: STUBS }
    });
    await new Promise((resolve) => setTimeout(resolve, 60));

    // * Guard against a vacuous pass: the component really rendered.
    expect(page.html()).toContain('button');

    // * Feature 006, Examples: a signed-out load makes no API request at all.
    expect(fetchBuildsSpy).not.toHaveBeenCalled();
  });

  it('fetches the account list once signed in', async () => {
    await mountSuspended(
      defineComponent({
        setup() {
          signIn();

          return () => h(BuildManager);
        }
      }),
      { global: { stubs: STUBS } }
    );

    await vi.waitFor(() => expect(fetchBuildsSpy).toHaveBeenCalled());
  });

  it('renders the account build name in the selector', async () => {
    const page = await mountSuspended(
      defineComponent({
        setup() {
          signIn();

          return () => h(BuildManager);
        }
      }),
      { global: { stubs: STUBS } }
    );

    // * The account builds are the dropdown's `items` prop, not markup — they only become markup once the menu opens. No spy assertion either: the list is already cached under the same key from the test above, so this mount legitimately serves it from cache.
    await vi.waitFor(() => {
      const menu = page.findComponent({ name: 'UDropdownMenu' });
      const groups = menu.props('items') as { label: string }[][];

      expect(groups.flat().map((item) => item.label)).toContain('Cloud build');
    });
  });
});

describe('BuildManager share', () => {
  const written: string[] = [];

  beforeEach(() => {
    written.length = 0;
    fetchBuildsSpy.mockReset();
    fetchBuildsSpy.mockResolvedValue(ACCOUNT_BUILDS);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: (text: string) => {
          written.push(text);

          return Promise.resolve();
        }
      }
    });
  });

  async function share(withAccountBuild: boolean) {
    const page = await mountSuspended(
      defineComponent({
        setup() {
          signIn();
          // ! Set both ways round: the store outlives a mount, so leaving it alone would carry the previous test's account build into this one and pass vacuously.
          useAuthStore().setActiveAccountBuildId(
            withAccountBuild ? ACCOUNT_BUILDS.items[0]!.id : null
          );

          return () => h(BuildManager);
        }
      }),
      { global: { stubs: STUBS } }
    );

    const button = page
      .findAll('button')
      .find((candidate) => /share/i.test(candidate.text()));

    expect(button, 'the share control rendered').toBeTruthy();
    await button!.trigger('click');
    await vi.waitFor(() => expect(written).toHaveLength(1));

    return written[0]!;
  }

  it('copies the live link for an account build', async () => {
    // ! Feature 005: an account build shares as /b/{id}, which always shows the owner's current document. A ?build= snapshot would freeze whatever was on screen.
    expect(await share(true)).toContain(`/b/${ACCOUNT_BUILDS.items[0]!.id}`);
  });

  it('copies a snapshot for a local build', async () => {
    // * A local build has no id on the server, so the URL has to carry the whole document.
    const url = await share(false);

    expect(url).toContain('?build=');
    expect(url).not.toContain('/b/');
  });
});
