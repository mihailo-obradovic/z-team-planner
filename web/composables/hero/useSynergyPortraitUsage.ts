import { synergyPortraitUsage } from '@/config/portraits';

// * The usage a synergy portrait declares at the current tab width (feature 028), shared by the portrait and the background download so both request one variant.
export function useSynergyPortraitUsage() {
  const tabWidth = useTabWidth();

  return computed(() => {
    if (tabWidth.value === 0) {
      return 'card';
    }

    const rootFontPx = parseFloat(
      getComputedStyle(document.documentElement).fontSize
    );

    return synergyPortraitUsage(tabWidth.value, rootFontPx);
  });
}
