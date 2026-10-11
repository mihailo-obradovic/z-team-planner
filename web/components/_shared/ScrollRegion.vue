<template>
  <component
    :is="as"
    ref="region"
    :class="['border transition-colors', OVERFLOW_CLASS[axis], edgeClasses]"
    @scroll.passive="scheduleMeasure"
  >
    <slot />
  </component>
</template>

<script setup lang="ts">
import type {
  HiddenEdges,
  ScrollableAxis,
  ScrollAxis
} from '@/utils/scrollEdges';

// * The component owns the scroll box, so the edge rules span its full width and content passes under them.
const OVERFLOW_CLASS: Record<ScrollAxis, string> = {
  vertical: 'overflow-y-auto',
  horizontal: 'overflow-x-auto',
  both: 'overflow-auto'
};

// * `--ui-border` measures 3.13:1 on paper, clearing the 3:1 floor an informational rule needs.
// ! Every edge is always drawn and only its colour changes: toggling the border would resize the content box and feed back into the measurement.
const EDGE_CLASS: Record<keyof HiddenEdges, { hidden: string; clear: string }> =
  {
    top: {
      hidden: 'border-t-[var(--ui-border)]',
      clear: 'border-t-transparent'
    },
    bottom: {
      hidden: 'border-b-[var(--ui-border)]',
      clear: 'border-b-transparent'
    },
    left: {
      hidden: 'border-l-[var(--ui-border)]',
      clear: 'border-l-transparent'
    },
    right: {
      hidden: 'border-r-[var(--ui-border)]',
      clear: 'border-r-transparent'
    }
  };

// * Longer than the longest enter in `motion.css` (the modal's 200 ms); a surface with no animation pays this once, before its first edge rule.
const ENTER_CEILING_MS = 300;

const NO_EDGES: HiddenEdges = {
  top: false,
  bottom: false,
  left: false,
  right: false
};

// * `as` keeps semantics, since two of the dialog's scroll areas are `nav` landmarks.
const { as = 'div', axis = 'vertical' } = defineProps<{
  as?: string;
  axis?: ScrollAxis;
}>();

const region = useTemplateRef<HTMLElement>('region');

const { edgeClasses, scheduleMeasure } = useHiddenEdges();

const { bringIntoView } = useBringIntoView();

// ! Read from the computed style, not `axis`: a responsive overflow class doesn't scroll at every width.
function scrollableAxis(element: HTMLElement): ScrollableAxis {
  const style = getComputedStyle(element);
  const vertical = scrolls(style.overflowY);
  const horizontal = scrolls(style.overflowX);

  if (vertical && horizontal) {
    return 'both';
  }

  if (vertical) {
    return 'vertical';
  }

  if (horizontal) {
    return 'horizontal';
  }

  return 'none';
}

function scrolls(overflow: string): boolean {
  return overflow === 'auto' || overflow === 'scroll';
}

defineExpose({ bringIntoView });

function useHiddenEdges() {
  const edges = ref<HiddenEdges>({ ...NO_EDGES });

  const edgeClasses = computed(() =>
    Object.entries(edges.value).map(([edge, isHidden]) => {
      const states = EDGE_CLASS[edge as keyof HiddenEdges];

      return isHidden ? states.hidden : states.clear;
    })
  );

  let resizeObserver: ResizeObserver | undefined;
  let mutationObserver: MutationObserver | undefined;
  let frame: number | undefined;

  // * Reads are batched to one per frame (decision 017): a scroll, a resize and the observer's first report of every child all arrive in a burst, and each read forces a layout of the surface the region sits in.
  function scheduleMeasure() {
    if (frame !== undefined) {
      return;
    }

    frame = requestAnimationFrame(() => {
      frame = undefined;
      measure();
    });
  }

  // * The first measure waits for the surface the region sits in to finish entering (decision 017; feature 013, "a region not laid out yet"): a dialog's enter animation scales the whole tree, and a read during it lays out the half-drawn dialog. Listened for, never queried — `getAnimations()` would itself force the layout being avoided — with a ceiling for a surface that has no animation to end.
  function entered(element: HTMLElement): Promise<void> {
    const surface = element.closest<HTMLElement>('[data-state="open"]');

    return new Promise((resolve) => {
      const ceiling = setTimeout(done, ENTER_CEILING_MS);

      surface?.addEventListener('animationend', done, { once: true });

      function done() {
        clearTimeout(ceiling);
        surface?.removeEventListener('animationend', done);
        resolve();
      }
    });
  }

  function measure() {
    const element = region.value;

    if (!element) {
      edges.value = { ...NO_EDGES };

      return;
    }

    edges.value = hiddenScrollEdges({
      scrollable: scrollableAxis(element),
      scrollTop: element.scrollTop,
      clientHeight: element.clientHeight,
      scrollHeight: element.scrollHeight,
      scrollLeft: element.scrollLeft,
      clientWidth: element.clientWidth,
      scrollWidth: element.scrollWidth
    });
  }

  // * Content growing inside never resizes the box, so the children are observed too.
  function observe() {
    const element = region.value;

    if (!element || !resizeObserver) {
      return;
    }

    resizeObserver.disconnect();

    for (const observed of [element, ...element.children]) {
      resizeObserver.observe(observed);
    }

    scheduleMeasure();
  }

  onMounted(() => {
    const element = region.value;

    if (!element) {
      return;
    }

    resizeObserver = new ResizeObserver(scheduleMeasure);
    // * A new child isn't observed yet.
    mutationObserver = new MutationObserver(observe);
    mutationObserver.observe(element, { childList: true });

    void entered(element).then(observe);
  });

  onBeforeUnmount(() => {
    resizeObserver?.disconnect();
    mutationObserver?.disconnect();

    if (frame !== undefined) {
      cancelAnimationFrame(frame);
    }
  });

  return { edgeClasses, scheduleMeasure };
}

function useBringIntoView() {
  // ! Never `scrollIntoView`: it also scrolls every scrolling ancestor, such as the dialog body.
  function bringIntoView(target: HTMLElement) {
    const element = region.value;

    if (!element || target === element || !element.contains(target)) {
      return;
    }

    const scrollable = scrollableAxis(element);
    const start = contentOffset(element, target);
    const gaps = scrollGaps(element);

    const left = scrollOffsetIntoView({
      scrollable: scrollable === 'horizontal' || scrollable === 'both',
      offset: element.scrollLeft,
      viewport: element.clientWidth,
      content: element.scrollWidth,
      targetStart: start.left,
      targetSize: target.offsetWidth,
      clearance: gaps.column
    });

    const top = scrollOffsetIntoView({
      scrollable: scrollable === 'vertical' || scrollable === 'both',
      offset: element.scrollTop,
      viewport: element.clientHeight,
      content: element.scrollHeight,
      targetStart: start.top,
      targetSize: target.offsetHeight,
      clearance: gaps.row
    });

    if (left === element.scrollLeft && top === element.scrollTop) {
      return;
    }

    // * Snaps under reduced motion but still runs, because it corrects what is visible.
    element.scrollTo({
      left,
      top,
      behavior: prefersReducedMotion() ? 'auto' : 'smooth'
    });
  }

  // ! Measured from the layout tree, not `getBoundingClientRect`: a dialog mid-enter is scaled and would misaim the scroll.
  function contentOffset(
    element: HTMLElement,
    target: HTMLElement
  ): { left: number; top: number } {
    let left = 0;
    let top = 0;

    for (
      let node: HTMLElement | null = target;
      node;
      node = node.offsetParent as HTMLElement | null
    ) {
      if (node === element) {
        return { left, top };
      }

      left += node.offsetLeft;
      top += node.offsetTop;

      if (!element.contains(node.offsetParent as Node | null)) {
        break;
      }
    }

    // * Both are measured from the same ancestor, since the region isn't an offset parent; `clientLeft` drops the border `scrollLeft` doesn't count.
    return {
      left: left - element.offsetLeft - element.clientLeft,
      top: top - element.offsetTop - element.clientTop
    };
  }

  // * The region's own gap, so a tile lands clear of the edge rule.
  function scrollGaps(element: HTMLElement): { column: number; row: number } {
    const style = getComputedStyle(element);

    return {
      column: Number.parseFloat(style.columnGap) || 0,
      row: Number.parseFloat(style.rowGap) || 0
    };
  }

  function prefersReducedMotion(): boolean {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  return { bringIntoView };
}
</script>
