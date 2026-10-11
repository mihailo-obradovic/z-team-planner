// * Whether an overlay (`catalyst/context/glossary.md`) is open. Read from the one mark every modal Reka layer leaves: while any is open, `body` carries an inline `pointer-events: none`, and only the topmost such layer takes pointer events back.
const isOpen = ref(false);

let attached = false;

export function useOverlayOpen() {
  if (import.meta.client && !attached && 'MutationObserver' in window) {
    attached = true;

    const { body } = document;

    isOpen.value = isMarked(body);
    // * Only `body`'s own style is watched, so the cost stays one callback per overlay opening or closing.
    new MutationObserver(() => {
      isOpen.value = isMarked(body);
    }).observe(body, { attributes: true, attributeFilter: ['style'] });
  }

  return readonly(isOpen);
}

function isMarked(body: HTMLElement): boolean {
  return body.style.pointerEvents === 'none';
}
