// * A `TransitionGroup` `beforeLeave` hook for a list whose leaving element is taken out of flow so its neighbours can travel while it fades, rather than after (annex §11, features 024 and 025).
// ! Its offsets have to be pinned first. An absolutely positioned child of a flex container is placed by the container's alignment, not by where it stood — a chip jumps to the middle of its centred row, a notes line to the top of its column — and Vue's move then drags it from that spot. The width is pinned with them so a line that wrapped does not re-wrap once it no longer has the column's width.
// ! Measured for the whole list on the first call of a batch, not per element: Vue runs the hooks for every element leaving in one change back to back, and the first one pinned is already out of flow when the second is asked where it stood, which would put the second a line too high. The measurements last a microtask — long enough for that synchronous run, gone before the next change.
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

const measuredLists = new WeakMap<
  Element,
  Map<Element, { left: number; top: number; width: number }>
>();
