// * Kept for one microtask, which spans Vue's synchronous run of a change's leave hooks.
const measuredLists = new WeakMap<
  Element,
  Map<Element, { left: number; top: number; width: number }>
>();

// * Pins a leaving element where it stood, so the CSS can take it out of flow and its neighbours travel while it fades (annex §11, features 024 and 025).
// ! Unpinned, an absolute flex child jumps to the container's alignment and a wrapped line re-wraps at a new width.
// ! The list is measured once per batch, because each pinned sibling leaves flow and shifts the ones measured after it.
export function pinLeaving(element: Element) {
  const leaving = element as HTMLElement;
  const list = leaving.parentElement;

  if (!list) {
    return;
  }

  let offsets = measuredLists.get(list);

  if (!offsets) {
    offsets = new Map(
      Array.from(list.children, (child) => {
        const inFlow = child as HTMLElement;

        return [
          child,
          {
            left: inFlow.offsetLeft,
            top: inFlow.offsetTop,
            width: inFlow.offsetWidth
          }
        ];
      })
    );
    measuredLists.set(list, offsets);
    queueMicrotask(() => measuredLists.delete(list));
  }

  const offset = offsets.get(leaving);

  if (!offset) {
    return;
  }

  leaving.style.left = `${offset.left}px`;
  leaving.style.top = `${offset.top}px`;
  leaving.style.width = `${offset.width}px`;
}
