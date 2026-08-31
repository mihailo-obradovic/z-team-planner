export const TAB_URL_PARAM = 'tab';

// * The planner's tabs, by their UTabs values. `overview` is the default and never appears
// * in the URL; the param is written only for the other two.
const TAB_VALUES = ['overview', 'synergy-pairs', 'mission-simulator'] as const;

export type TabValue = (typeof TAB_VALUES)[number];

function isTabValue(value: unknown): value is TabValue {
  return TAB_VALUES.includes(value as TabValue);
}

// * Feature 015: the active tab lives in the URL but never in the build document — switching
// * tabs must not mark the build dirty, so this composable touches no planner state.
export function useActiveTab() {
  const activeTab = useState<TabValue>('activeTab', () => 'overview');

  // * Called on mount, not during setup: `/` is prerendered with the overview active, and the
  // * server cannot know the query, so the switch happens client-side — like `?build=`.
  function initTabFromUrl() {
    if (import.meta.server) {
      return;
    }

    const param = useRoute().query[TAB_URL_PARAM];

    if (isTabValue(param) && param !== 'overview') {
      activeTab.value = param;
    } else if (param !== undefined) {
      // * A dead value would re-trip on every reload; strip it the way `?build=` is stripped.
      writeTabToUrl('overview');
    }
  }

  function setActiveTab(value: TabValue) {
    activeTab.value = value;
    writeTabToUrl(value);
  }

  // * `replaceState`, never a router push: tab switches are not history entries.
  function writeTabToUrl(value: TabValue) {
    const url = new URL(window.location.href);

    if (value === 'overview') {
      url.searchParams.delete(TAB_URL_PARAM);
    } else {
      url.searchParams.set(TAB_URL_PARAM, value);
    }

    window.history.replaceState({}, '', url.toString());
  }

  return { activeTab, initTabFromUrl, setActiveTab };
}
