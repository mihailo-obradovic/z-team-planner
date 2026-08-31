import { beforeEach, describe, expect, it } from 'vitest';
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime';
import { defineComponent, h } from 'vue';

// * The tab never touches planner state (feature 015): these tests drive only the composable
// * and assert against the URL, which is the whole externally visible contract.

const routeQuery: Record<string, string> = {};

mockNuxtImport('useRoute', () => () => ({ query: routeQuery }));

let currentUrl = new URL('https://planner.test/');

Object.defineProperty(window, 'location', {
  configurable: true,
  get: () => currentUrl
});

Object.defineProperty(window.history, 'replaceState', {
  configurable: true,
  value: (_state: unknown, _title: string, url: string) => {
    currentUrl = new URL(url);
  }
});

async function freshTabs() {
  let tabs!: ReturnType<typeof useActiveTab>;

  await mountSuspended(
    defineComponent({
      setup() {
        tabs = useActiveTab();

        return () => h('div');
      }
    })
  );

  tabs.activeTab.value = 'overview';

  return tabs;
}

describe('the tab in the URL (feature 015)', () => {
  beforeEach(() => {
    currentUrl = new URL('https://planner.test/');
    delete routeQuery.tab;
  });

  it('starts on the overview when there is no param', async () => {
    const tabs = await freshTabs();

    tabs.initTabFromUrl();

    expect(tabs.activeTab.value).toBe('overview');
    expect(currentUrl.searchParams.has('tab')).toBe(false);
  });

  it('opens the tab the param names', async () => {
    const tabs = await freshTabs();

    routeQuery.tab = 'mission-simulator';
    tabs.initTabFromUrl();

    expect(tabs.activeTab.value).toBe('mission-simulator');
  });

  it('strips an unknown value and stays on the overview', async () => {
    const tabs = await freshTabs();

    currentUrl = new URL('https://planner.test/?tab=nonsense');
    routeQuery.tab = 'nonsense';
    tabs.initTabFromUrl();

    expect(tabs.activeTab.value).toBe('overview');
    expect(currentUrl.searchParams.has('tab')).toBe(false);
  });

  it('writes the param on a switch and removes it for the overview', async () => {
    const tabs = await freshTabs();

    tabs.setActiveTab('synergy-pairs');

    expect(currentUrl.searchParams.get('tab')).toBe('synergy-pairs');

    tabs.setActiveTab('overview');

    expect(currentUrl.searchParams.has('tab')).toBe(false);
  });

  it('switches without touching the rest of the URL', async () => {
    const tabs = await freshTabs();

    currentUrl = new URL('https://planner.test/?build=abc');

    tabs.setActiveTab('mission-simulator');

    // * A share link copied now carries both: the recipient lands on the sender's tab.
    expect(currentUrl.searchParams.get('build')).toBe('abc');
    expect(currentUrl.searchParams.get('tab')).toBe('mission-simulator');
  });

  it('never enters the build document', async () => {
    const tabs = await freshTabs();
    const state = usePlannerState();
    const before = JSON.stringify(serializeBuild(state));

    tabs.setActiveTab('mission-simulator');

    expect(JSON.stringify(serializeBuild(state))).toBe(before);
  });
});
