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

// * The scroll box is the component's, so the edge rules run its full width and content passes under them
// * rather than stopping short of an inset line.
const OVERFLOW_CLASS: Record<ScrollAxis, string> = {
  vertical: 'overflow-y-auto',
  horizontal: 'overflow-x-auto',
  both: 'overflow-auto'
};

// * 1px at the divider tier (annex §5). `--ui-border` measures 3.13:1 on paper, clearing the 3:1 floor that
// * applies because this rule carries information — it is the only sign that content is off-screen.
// ! Every edge is always drawn and only its colour changes. Toggling the border itself would resize the
// ! content box by 1px each time an edge is reached, jittering the content and feeding that 1px straight
// ! back into the measurement it came from. Naming both states also keeps the pair one directional utility,
// ! so which of them paints is not left to the order Tailwind happens to emit them in.
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

// * `as` keeps the region's own semantics: two of the hero dialog's scroll areas are `nav` landmarks, and a
// * component that could only render a div would trade an aria landmark for a border.
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

// ! Read from the computed style rather than trusted from the `axis` prop: a region carrying a responsive
// ! overflow class does not scroll at every width, and an element with `overflow: visible` still reports
// ! scrollHeight past clientHeight — which would rule an edge the user cannot reach.
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

// * The container and its content are separate signals. Content growing inside a scroll box never resizes
// * the box, so observing only the region misses slot content changing — the common case in a dialog.
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

// * The caller decides when something must be seen; the region owns how far it has to move (feature 013).
// ! Never `Element.scrollIntoView`: it walks the ancestor chain, so bringing a tile into a ribbon would
// ! also scroll the dialog body it sits in. This moves the region and nothing above it.
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

  // * Past the baseline, so it snaps under reduced motion — but it still runs: it corrects what is visible
  // * rather than decorating it (annex §14.4).
  element.scrollTo({
    left,
    top,
    behavior: prefersReducedMotion() ? 'auto' : 'smooth'
  });
}

// ! Read from the layout tree, never from `getBoundingClientRect`. A dialog mid enter-animation is scaled,
// ! and a scaled rect delta compared against an unscaled `scrollLeft` aims the scroll wrong. Offsets are
// ! layout positions: unaffected by transforms, and already relative to the content rather than the viewport.
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

  // * The region is not itself an offset parent, so it and the target are measured from the same ancestor.
  // * Its border sits outside the padding box `scrollLeft` counts from, hence `clientLeft`.
  return {
    left: left - element.offsetLeft - element.clientLeft,
    top: top - element.offsetTop - element.clientTop
  };
}

// * The clearance is the region's own gap, so a tile lands beside its neighbour rather than flush against
// * the clipping edge and under the 1px rule. A region with no gap gets none — there is nothing to sit beside.
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
