import { describe, expect, it } from 'vitest';

import { radarCoverage } from '@/utils/radarCoverage';

// * The analytic sector geometry checked two ways: closed-form cases, and an independent
// * numeric integration (ray-cast min radius) that knows nothing of the implementation.

function axisPoint(values: number[], index: number) {
  const angle = (2 * Math.PI * index) / values.length - Math.PI / 2;

  return {
    x: values[index]! * Math.cos(angle),
    y: values[index]! * Math.sin(angle)
  };
}

function starArea(values: number[]): number {
  let area = 0;

  for (let i = 0; i < values.length; i++) {
    const a = axisPoint(values, i);
    const b = axisPoint(values, (i + 1) % values.length);

    area += Math.abs(a.x * b.y - a.y * b.x) / 2;
  }

  return area;
}

function radiusAt(values: number[], theta: number): number {
  const n = values.length;
  const sectorSize = (2 * Math.PI) / n;
  const relative =
    (((theta + Math.PI / 2) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  const sector = Math.min(Math.floor(relative / sectorSize), n - 1);
  const p1 = axisPoint(values, sector);
  const p2 = axisPoint(values, (sector + 1) % n);
  const d = { x: Math.cos(theta), y: Math.sin(theta) };
  const chord = { x: p2.x - p1.x, y: p2.y - p1.y };
  const denominator = d.x * chord.y - d.y * chord.x;

  if (denominator === 0) {
    return 0;
  }

  return Math.max(0, (p1.x * chord.y - p1.y * chord.x) / denominator);
}

function numericCoverage(team: number[], required: number[]): number {
  const samples = 200_000;
  const step = (2 * Math.PI) / samples;
  let shared = 0;

  for (let i = 0; i < samples; i++) {
    const theta = (i + 0.5) * step;
    const radius = Math.min(radiusAt(team, theta), radiusAt(required, theta));

    shared += 0.5 * radius * radius * step;
  }

  return shared / starArea(required);
}

describe('radarCoverage', () => {
  it('is 1 for identical shapes and for full containment', () => {
    expect(radarCoverage([4, 9, 6, 2, 8], [4, 9, 6, 2, 8])).toBeCloseTo(1, 10);
    expect(radarCoverage([10, 10, 10, 10, 10], [5, 6, 7, 3, 4])).toBeCloseTo(
      1,
      10
    );
  });

  it('scales with the square for uniform shapes', () => {
    expect(radarCoverage([5, 5, 5, 5, 5], [10, 10, 10, 10, 10])).toBeCloseTo(
      0.25,
      10
    );
  });

  it('is 1 when nothing is required, 0 when the team is empty', () => {
    expect(radarCoverage([0, 0, 0, 0, 0], [0, 0, 0, 0, 0])).toBe(1);
    expect(radarCoverage([3, 3, 3, 3, 3], [0, 0, 0, 0, 0])).toBe(1);
    expect(radarCoverage([0, 0, 0, 0, 0], [4, 4, 4, 4, 4])).toBe(0);
  });

  it('matches an independent numeric integration on crossing shapes', () => {
    const cases: [number[], number[]][] = [
      [
        [8, 2, 8, 2, 8],
        [2, 8, 2, 8, 2]
      ],
      [
        [10, 3, 0, 7, 5],
        [4, 9, 6, 2, 8]
      ],
      [
        [1, 10, 1, 10, 1],
        [6, 6, 6, 6, 6]
      ]
    ];

    for (const [team, required] of cases) {
      expect(radarCoverage(team, required)).toBeCloseTo(
        numericCoverage(team, required),
        3
      );
    }
  });

  it('shares area symmetrically', () => {
    const a = [7, 2, 9, 4, 5];
    const b = [3, 8, 1, 10, 6];

    expect(radarCoverage(a, b) * starArea(b)).toBeCloseTo(
      radarCoverage(b, a) * starArea(a),
      10
    );
  });
});
