// * Measurements last a microtask: long enough for Vue's synchronous run of every leave hook in one change, gone before the next change.
const measuredLists = new WeakMap<
  Element,
  Map<Element, { left: number; top: number; width: number }>
>();

// * A `TransitionGroup` `beforeLeave` hook that takes the leaving element out of flow, so its neighbours travel while it fades rather than after (annex §11, features 024 and 025).
// ! Offsets are pinned first because an absolutely positioned flex child is placed by the container's alignment, not where it stood, and Vue's move would drag it from there. The width is pinned too, so a wrapped line does not re-wrap outside its column.
// ! The whole list is measured on a batch's first call: the first element pinned is already out of flow when the second is measured, which would put the second a line too high.
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
