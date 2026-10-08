// * Which device this browser is, for the icon a local build's location shows (feature 029). Read from input capability and width, never the user agent: a touch laptop that can hover is a monitor.
export type DeviceClass = 'phone' | 'tablet' | 'monitor';

const TOUCH_QUERY = '(hover: none) and (pointer: coarse)';
// * 31rem is the shell's phone threshold (annex §13).
const PHONE_QUERY = `${TOUCH_QUERY} and (max-width: 31rem)`;

// * One shared value for the whole app, attached once, like `useInputMode`.
const deviceClass = ref<DeviceClass>('monitor');

let attached = false;

export function useDeviceClass() {
  if (import.meta.client && !attached && 'matchMedia' in window) {
    attached = true;

    const touch = window.matchMedia(TOUCH_QUERY);
    const phone = window.matchMedia(PHONE_QUERY);

    function update() {
      deviceClass.value = classOf(touch.matches, phone.matches);
    }

    update();
    touch.addEventListener('change', update);
    phone.addEventListener('change', update);
  }

  return readonly(deviceClass);
}

function classOf(isTouch: boolean, isPhone: boolean): DeviceClass {
  if (isPhone) {
    return 'phone';
  }

  return isTouch ? 'tablet' : 'monitor';
}
