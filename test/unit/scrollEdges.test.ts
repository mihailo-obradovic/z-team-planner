import { describe, expect, it } from 'vitest';

import {
  hiddenScrollEdges,
  type ScrollableAxis,
  type ScrollMetrics
} from '@/utils/scrollEdges';

// * A 300px-tall viewport over 900px of content, so 600px of scroll range — the shape of the dialog's powers column.
function verticalMetrics(
  scrollTop: number,
  overrides: Partial<ScrollMetrics> = {}
): ScrollMetrics {
  return {
    scrollable: 'vertical',
    scrollTop,
    clientHeight: 300,
    scrollHeight: 900,
    scrollLeft: 0,
    clientWidth: 300,
    scrollWidth: 300,
    ...overrides
  };
}

function horizontalMetrics(
  scrollLeft: number,
  overrides: Partial<ScrollMetrics> = {}
): ScrollMetrics {
  return {
    scrollable: 'horizontal',
    scrollTop: 0,
    clientHeight: 100,
    scrollHeight: 100,
    scrollLeft,
    clientWidth: 300,
    scrollWidth: 900,
    ...overrides
  };
}

describe('hiddenScrollEdges', () => {
  it('marks only the trailing edge at the start of the range', () => {
    expect(hiddenScrollEdges(verticalMetrics(0))).toMatchObject({
      top: false,
      bottom: true
    });
  });

  it('marks both edges mid-scroll', () => {
    expect(hiddenScrollEdges(verticalMetrics(300))).toMatchObject({
      top: true,
      bottom: true
    });
  });

  it('marks only the leading edge at the end of the range', () => {
    expect(hiddenScrollEdges(verticalMetrics(600))).toMatchObject({
      top: true,
      bottom: false
    });
  });

  // ! The regression this whole function exists for: an exact comparison keeps the bottom rule painted here.
  it('treats a fractional pixel short of the end as the end', () => {
    expect(hiddenScrollEdges(verticalMetrics(599.6))).toMatchObject({
      top: true,
      bottom: false
    });
  });

  it('treats a fractional pixel past the start as the start', () => {
    expect(hiddenScrollEdges(verticalMetrics(0.4))).toMatchObject({
      top: false,
      bottom: true
    });
  });

  it('marks nothing when the content fits', () => {
    const metrics = verticalMetrics(0, { scrollHeight: 200 });

    expect(hiddenScrollEdges(metrics)).toEqual({
      top: false,
      bottom: false,
      left: false,
      right: false
    });
  });

  it('mirrors the vertical behaviour on the horizontal axis', () => {
    expect(hiddenScrollEdges(horizontalMetrics(0))).toMatchObject({
      left: false,
      right: true
    });
    expect(hiddenScrollEdges(horizontalMetrics(300))).toMatchObject({
      left: true,
      right: true
    });
    expect(hiddenScrollEdges(horizontalMetrics(600))).toMatchObject({
      left: true,
      right: false
    });
  });

  it('marks all four edges when both axes scroll', () => {
    const metrics: ScrollMetrics = {
      scrollable: 'both',
      scrollTop: 300,
      clientHeight: 300,
      scrollHeight: 900,
      scrollLeft: 300,
      clientWidth: 300,
      scrollWidth: 900
    };

    expect(hiddenScrollEdges(metrics)).toEqual({
      top: true,
      bottom: true,
      left: true,
      right: true
    });
  });

  // ! Overflowing content still reports scrollHeight > clientHeight when overflow is `visible`, so an
  // ! `lg:overflow-y-auto` region below `lg` would otherwise be ruled on an axis the user cannot scroll.
  it.each<[string, ScrollableAxis]>([
    ['neither axis scrolls', 'none'],
    ['only the other axis scrolls', 'horizontal']
  ])('marks no vertical edge when %s', (_label, scrollable) => {
    const metrics = verticalMetrics(300, { scrollable, scrollWidth: 300 });

    expect(hiddenScrollEdges(metrics)).toMatchObject({
      top: false,
      bottom: false
    });
  });
});
