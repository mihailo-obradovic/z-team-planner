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
</script>
