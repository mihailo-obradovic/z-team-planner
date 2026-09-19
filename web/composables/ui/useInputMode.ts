// * A property of the device, never of the viewport width (feature 018).
export type InputMode = 'hover' | 'no-hover';

const HOVER_QUERY = '(hover: hover) and (pointer: fine)';

// * One shared value for the whole app: the device does not differ per component, and the query is attached once.
const mode = ref<InputMode>('hover');

let attached = false;

export function useInputMode() {
  if (import.meta.client && !attached && 'matchMedia' in window) {
    attached = true;

    const query = window.matchMedia(HOVER_QUERY);

    mode.value = modeOf(query);
    // * A mouse plugged into a tablet flips the query live; the next interaction follows the new mode.
    query.addEventListener('change', (event) => {
      mode.value = modeOf(event);
    });
  }

  return readonly(mode);
}

function modeOf(query: { matches: boolean }): InputMode {
  return query.matches ? 'hover' : 'no-hover';
}
