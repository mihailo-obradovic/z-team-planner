<template>
  <component
    :is="as"
    ref="region"
    :class="['border transition-colors', OVERFLOW_CLASS[axis], edgeClasses]"
    @scroll.passive="measure"
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

// * The scroll box is the component's own, so the edge rules run its full width and content passes under them.
const OVERFLOW_CLASS: Record<ScrollAxis, string> = {
  vertical: 'overflow-y-auto',
  horizontal: 'overflow-x-auto',
  both: 'overflow-auto'
};

// * `--ui-border` measures 3.13:1 on paper, clearing the 3:1 floor this rule needs because it carries information (annex §5).
// ! Every edge is always drawn and only its colour changes: toggling the border would resize the content box by 1px and feed it back into the measurement. Naming both states keeps the pair one directional utility, independent of Tailwind's emit order.
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

const NO_EDGES: HiddenEdges = {
  top: false,
  bottom: false,
  left: false,
  right: false
};

// * `as` keeps the region's own semantics, since two of the hero dialog's scroll areas are `nav` landmarks.
const { as = 'div', axis = 'vertical' } = defineProps<{
  as?: string;
  axis?: ScrollAxis;
}>();

const region = useTemplateRef<HTMLElement>('region');

const edges = ref<HiddenEdges>({ ...NO_EDGES });

const edgeClasses = computed(() =>
  Object.entries(edges.value).map(([edge, isHidden]) => {
    const states = EDGE_CLASS[edge as keyof HiddenEdges];

    return isHidden ? states.hidden : states.clear;
  })
);

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

// ! Read from the computed style, not the `axis` prop: a responsive overflow class does not scroll at every width, and `overflow: visible` still reports scrollHeight past clientHeight.
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

// * Content growing inside a scroll box never resizes the box, so observing only the region would miss slot content changing.
function observedElements(element: HTMLElement): HTMLElement[] {
  return [element, ...(Array.from(element.children) as HTMLElement[])];
}

let resizeObserver: ResizeObserver | undefined;
let mutationObserver: MutationObserver | undefined;

function observe() {
  const element = region.value;

  if (!element || !resizeObserver) {
    return;
  }

  resizeObserver.disconnect();

  for (const observed of observedElements(element)) {
    resizeObserver.observe(observed);
  }

  measure();
}

onMounted(() => {
  const element = region.value;

  if (!element) {
    return;
  }

  resizeObserver = new ResizeObserver(measure);
  // * Children come and go, and a new one is content the resize observer is not yet watching.
  mutationObserver = new MutationObserver(observe);
  mutationObserver.observe(element, { childList: true });

  observe();
});

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
  mutationObserver?.disconnect();
});

// * The caller decides when something must be seen; the region owns how far it moves (feature 013).
// ! Never `Element.scrollIntoView`: it walks the ancestor chain, so bringing a tile into a ribbon would also scroll the dialog body it sits in.
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

  // * Snaps under reduced motion but still runs, because it corrects what is visible rather than decorating it (annex §14.4).
  element.scrollTo({
    left,
    top,
    behavior: prefersReducedMotion() ? 'auto' : 'smooth'
  });
}

// ! Read from the layout tree, never `getBoundingClientRect`: a dialog mid enter-animation is scaled, and a scaled rect compared against an unscaled `scrollLeft` aims the scroll wrong.
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

  // * The region is not an offset parent, so both are measured from the same ancestor; `clientLeft` removes the border outside the padding box `scrollLeft` counts from.
  return {
    left: left - element.offsetLeft - element.clientLeft,
    top: top - element.offsetTop - element.clientTop
  };
}

// * The clearance is the region's own gap, so a tile lands beside its neighbour rather than flush under the edge rule.
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

defineExpose({ bringIntoView });
</script>
