export type ScrollAxis = 'vertical' | 'horizontal' | 'both';

// * What the element scrolls right now, not the axis it was asked for: `lg:overflow-y-auto` asks for 'vertical' at every width and scrolls on none below `lg`.
export type ScrollableAxis = ScrollAxis | 'none';

export type ScrollMetrics = {
  scrollable: ScrollableAxis;
  scrollTop: number;
  clientHeight: number;
  scrollHeight: number;
  scrollLeft: number;
  clientWidth: number;
  scrollWidth: number;
};

export type HiddenEdges = {
  top: boolean;
  bottom: boolean;
  left: boolean;
  right: boolean;
};

// ! Fractional device pixel ratios round scrollTop, clientHeight and scrollHeight independently, so a region scrolled to the end lands a fraction short of its scrollHeight. Comparing exactly leaves the trailing rule painted there on phones.
const EDGE_TOLERANCE_PX = 1;

// * An edge carries a rule only while content is hidden past it; one overflow check for both edges would claim more above while the user sits at the top.
export function hiddenScrollEdges(metrics: ScrollMetrics): HiddenEdges {
  const vertical = scrollsOn(metrics.scrollable, 'vertical');
  const horizontal = scrollsOn(metrics.scrollable, 'horizontal');

  return {
    top: vertical && isPastStart(metrics.scrollTop),
    bottom:
      vertical &&
      isBeforeEnd(
        metrics.scrollTop,
        metrics.clientHeight,
        metrics.scrollHeight
      ),
    left: horizontal && isPastStart(metrics.scrollLeft),
    right:
      horizontal &&
      isBeforeEnd(metrics.scrollLeft, metrics.clientWidth, metrics.scrollWidth)
  };
}

function scrollsOn(
  scrollable: ScrollableAxis,
  axis: 'vertical' | 'horizontal'
): boolean {
  return scrollable === axis || scrollable === 'both';
}

function isPastStart(offset: number): boolean {
  return offset > EDGE_TOLERANCE_PX;
}

function isBeforeEnd(
  offset: number,
  viewport: number,
  content: number
): boolean {
  return offset + viewport < content - EDGE_TOLERANCE_PX;
}

export type ViewportSpan = {
  scrollable: boolean;
  offset: number;
  viewport: number;
  content: number;
  targetStart: number;
  targetSize: number;
  clearance: number;
};

// * The minimum offset that leaves the target fully visible on one axis, or the current offset unchanged so a caller can compare and skip.
export function scrollOffsetIntoView(span: ViewportSpan): number {
  if (!span.scrollable) {
    return span.offset;
  }

  const targetEnd = span.targetStart + span.targetSize;
  const visibleEnd = span.offset + span.viewport;

  if (
    span.targetStart >= span.offset - EDGE_TOLERANCE_PX &&
    targetEnd <= visibleEnd + EDGE_TOLERANCE_PX
  ) {
    return span.offset;
  }

  // ! Clamping makes the clearance give way first: a target near the end of the range still lands fully visible, just without the gap beside it.
  const wanted =
    span.targetStart < span.offset
      ? span.targetStart - span.clearance
      : targetEnd + span.clearance - span.viewport;

  return clamp(wanted, 0, Math.max(0, span.content - span.viewport));
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
