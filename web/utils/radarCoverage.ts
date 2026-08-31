// * Feature 015: mission success starts from radar coverage — the area the team's radar
// * shape shares with the required shape, over the required shape's area. Both shapes are
// * star polygons on the same equally-spaced axes (RADAR_STAT_ORDER decides which values
// * land where), so the intersection is computed sector by sector: in each sector the
// * boundary is whichever chord runs nearer the center, and the two chords cross at most
// * once, splitting the sector into two triangles at the crossing point.

interface Point {
  x: number;
  y: number;
}

export function radarCoverage(team: number[], required: number[]): number {
  const requiredArea = starArea(required);

  // * Nothing required is trivially covered — with or without a team.
  if (requiredArea === 0) {
    return 1;
  }

  return sharedArea(team, required) / requiredArea;
}

function axisPoint(values: number[], index: number): Point {
  const angle = (2 * Math.PI * index) / values.length - Math.PI / 2;

  return {
    x: values[index]! * Math.cos(angle),
    y: values[index]! * Math.sin(angle)
  };
}

function triangleArea(a: Point, b: Point): number {
  return Math.abs(cross(a, b)) / 2;
}

function cross(a: Point, b: Point): number {
  return a.x * b.y - a.y * b.x;
}

function starArea(values: number[]): number {
  let area = 0;

  for (let i = 0; i < values.length; i++) {
    area += triangleArea(
      axisPoint(values, i),
      axisPoint(values, (i + 1) % values.length)
    );
  }

  return area;
}

function sharedArea(team: number[], required: number[]): number {
  let area = 0;

  for (let i = 0; i < required.length; i++) {
    const next = (i + 1) % required.length;
    const t1 = axisPoint(team, i);
    const t2 = axisPoint(team, next);
    const r1 = axisPoint(required, i);
    const r2 = axisPoint(required, next);
    const n1 = team[i]! <= required[i]! ? t1 : r1;
    const n2 = team[next]! <= required[next]! ? t2 : r2;
    const crossing = chordCrossing(t1, t2, r1, r2);

    // * Same chord nearer at both axis ends: one triangle. Otherwise the chords cross
    // * inside the sector and the shared region splits there.
    area += crossing
      ? triangleArea(n1, crossing) + triangleArea(crossing, n2)
      : triangleArea(n1, n2);
  }

  return area;
}

// * The intersection point of the two sector chords, or null when they do not cross
// * strictly inside both segments (parallel, touching at an axis, or one fully inside).
function chordCrossing(
  t1: Point,
  t2: Point,
  r1: Point,
  r2: Point
): Point | null {
  const d1 = { x: t2.x - t1.x, y: t2.y - t1.y };
  const d2 = { x: r2.x - r1.x, y: r2.y - r1.y };
  const denominator = cross(d1, d2);

  if (denominator === 0) {
    return null;
  }

  const offset = { x: r1.x - t1.x, y: r1.y - t1.y };
  const u = cross(offset, d2) / denominator;
  const v = cross(offset, d1) / denominator;

  if (u <= 0 || u >= 1 || v <= 0 || v >= 1) {
    return null;
  }

  return { x: t1.x + u * d1.x, y: t1.y + u * d1.y };
}
