<template>
  <div
    ref="region"
    :class="[OVERFLOW_CLASS[axis], edgeClasses]"
    @scroll.passive="measure"
  >
    <slot />
  </div>
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

// * 1px at the divider tier (annex §5). `border-default` measures 3.13:1 on paper, clearing the 3:1 floor
// * that applies because this rule carries information — it is the only sign that content is off-screen.
const EDGE_CLASS: Record<keyof HiddenEdges, string> = {
  top: 'border-t border-default',
  bottom: 'border-b border-default',
  left: 'border-l border-default',
  right: 'border-r border-default'
};

const NO_EDGES: HiddenEdges = {
  top: false,
  bottom: false,
  left: false,
  right: false
};

const { axis = 'vertical' } = defineProps<{ axis?: ScrollAxis }>();

const region = useTemplateRef<HTMLElement>('region');

const edges = ref<HiddenEdges>({ ...NO_EDGES });

const edgeClasses = computed(() =>
  Object.entries(edges.value)
    .filter(([, hidden]) => hidden)
    .map(([edge]) => EDGE_CLASS[edge as keyof HiddenEdges])
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
</script>
