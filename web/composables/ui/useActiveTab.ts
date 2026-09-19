export const TAB_URL_PARAM = 'tab';

// * `overview` is the default and never appears in the URL.
const TAB_VALUES = ['overview', 'synergy-pairs', 'mission-simulator'] as const;

export type TabValue = (typeof TAB_VALUES)[number];

// * The tab lives in the URL but never in the build document, so switching tabs never marks the build dirty (feature 015).
export function useActiveTab() {
  const activeTab = useState<TabValue>('activeTab', () => 'overview');

  // * Called on mount, not during setup: `/` is prerendered with the overview active, and the server cannot know the query.
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

  // ! Bind this with `v-model`: with a one-way `:model-value` plus an update handler, the tabs component keeps its own copy of the selection and two panels can show at once.
  // * The tabs component models its value as `string | number`, so the setter narrows rather than a caller casting.
  const activeTabModel = computed<TabValue, string | number>({
    get: () => activeTab.value,
    set: (value) => {
      if (isTabValue(value)) {
        setActiveTab(value);
      }
    }
  });

  return { activeTab, activeTabModel, initTabFromUrl, setActiveTab };
}

function isTabValue(value: unknown): value is TabValue {
  return TAB_VALUES.includes(value as TabValue);
}
