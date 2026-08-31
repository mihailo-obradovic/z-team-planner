<template>
  <!-- * `role="img"` with a title and description: the chart is one graphic, and the numbers behind it are already real text in the stat rows beside it, so a second hidden table would only duplicate them (decision 008). -->
  <!-- ! `block max-w-full` is load-bearing, not tidying: WebKit gives a `viewBox`ed SVG a min-content width of its intrinsic 320px where Chromium gives 0, so without the cap the chart floors the width of whatever holds it and the dialog's mobile column scrolls sideways on iOS. -->
  <svg
    :viewBox="`0 0 ${WIDTH} ${HEIGHT}`"
    class="block h-full w-full max-w-full"
    role="img"
    :aria-labelledby="`${uid}-title ${uid}-desc`"
    preserveAspectRatio="xMidYMid meet"
  >
    <title :id="`${uid}-title`">{{ title }}</title>
    <desc :id="`${uid}-desc`">{{ description }}</desc>

    <!-- * Rings every 2 points on the 0-10 scale, drawn outermost first so the axis spokes and the data sit above them. -->
    <polygon
      v-for="ring in RINGS"
      :key="ring"
      :points="ringPoints(ring)"
      fill="none"
      :stroke="ring === MAX ? 'var(--ui-border)' : 'var(--ui-border-muted)'"
      :stroke-width="ring === MAX ? 2 : 1"
    />

    <line
      v-for="(axis, index) in axes"
      :key="`spoke-${axis.key}`"
      :x1="CENTRE_X"
      :y1="CENTRE_Y"
      :x2="vertex(index, RADIUS).x"
      :y2="vertex(index, RADIUS).y"
      stroke="var(--ui-border-muted)"
      stroke-width="1"
    />

    <polygon
      :points="dataPoints"
      fill="var(--ui-primary)"
      fill-opacity="0.5"
      stroke="var(--ui-primary)"
      stroke-width="2"
      stroke-linejoin="round"
    />

    <circle
      v-for="(point, index) in dataVertices"
      :key="`plot-${index}`"
      :cx="point.x"
      :cy="point.y"
      r="3"
      fill="var(--ui-primary)"
    />

    <!-- * Icons alone, no words: the stat rows beside the chart already name every axis, so repeating the names here only shrank the polygon to make room for them. Each glyph sits in a solid ink disc, as on the mockup's axis markers — a bare icon floating against the grid read as debris. Nothing here is rotated. -->
    <!-- ! The glyph is cream, not `text-inverted`: this project remaps `--ui-text-inverted` to ink for the amber and gold solids, so on an ink disc it would be invisible. `text-neutral-100` is the same call app.vue makes for the chrome glyphs. -->
    <g
      v-for="(axis, index) in axes"
      :key="`label-${axis.key}`"
      :transform="`translate(${labelAnchor(index).x}, ${labelAnchor(index).y})`"
    >
      <circle :r="ICON_RADIUS" :cx="0" :cy="0" fill="var(--ui-text)" />

      <foreignObject
        :x="-ICON_BOX / 2"
        :y="-ICON_BOX / 2"
        :width="ICON_BOX"
        :height="ICON_BOX"
      >
        <div
          class="flex size-full items-center justify-center text-neutral-100"
        >
          <u-icon :name="axis.icon" class="size-6" />
        </div>
      </foreignObject>
    </g>
  </svg>
</template>

<script setup lang="ts">
// * The radar the planner draws its stats on. Hand-rolled rather than charted by a library: decision 008 records why — axis orientation, an icon before each label, and a tween on value change are all absent from what was here before.

type RadarAxis = {
  key: string;
  label: string;
  icon: string;
  value: number;
};

const props = withDefaults(
  defineProps<{
    axes: RadarAxis[];
    title: string;
    max?: number;
    durationMs?: number;
  }>(),
  { max: 10, durationMs: 200 }
);

// * Square, and the polygon fills nearly all of it. Dropping the word labels is what bought the room: the box only has to clear a disc at each vertex now, not a word hanging off one.
const WIDTH = 320;
const HEIGHT = 320;
const CENTRE_X = WIDTH / 2;
const RADIUS = 118;
const ICON_BOX = 24;
const ICON_RADIUS = 17;
// * How far past the outer ring a disc's centre sits — enough clearance that the disc reads as separate from the pentagon rather than stuck to it.
const ICON_OFFSET = 28;

const MAX = computed(() => props.max);

// * Every 2 points, per the design brief — the array is the rule.
const RINGS = computed(() => {
  const rings: number[] = [];

  for (let value = 2; value <= MAX.value; value += 2) {
    rings.push(value);
  }

  return rings;
});

const uid = useId();

// * The whole reason this is hand-rolled: a quarter turn back from due east puts axis 0 at the apex by construction, so nothing downstream is rotated and no label needs counter-rotating.
const START_ANGLE = -Math.PI / 2;

const step = computed(() => (2 * Math.PI) / props.axes.length);

const targetValues = computed(() => props.axes.map((axis) => axis.value));

const displayedValues = useTweenedValues(targetValues, props.durationMs);

const description = computed(() =>
  props.axes.map((axis) => `${axis.label} ${axis.value}`).join(', ')
);

function angle(index: number): number {
  return START_ANGLE + index * step.value;
}

// ! Not `HEIGHT / 2`: with the apex pointing up, a pentagon is taller above its centre than below it — the top vertex sits a full radius out while the bottom two reach only `sin 54°` of it. Centring the drawing on the box's middle therefore leaves the whole chart sitting visibly high. This centres the drawn EXTENT instead, discs included, so the shape reads as centred in its panel.
const CENTRE_Y = computed(() => {
  const reach = RADIUS + ICON_OFFSET + ICON_RADIUS;
  const sines = props.axes.map((_, index) => Math.sin(angle(index)));
  const top = Math.min(...sines) * reach;
  const bottom = Math.max(...sines) * reach;

  return HEIGHT / 2 - (top + bottom) / 2;
});

function vertex(index: number, radius: number) {
  return {
    x: CENTRE_X + Math.cos(angle(index)) * radius,
    y: CENTRE_Y.value + Math.sin(angle(index)) * radius
  };
}

function ringPoints(ring: number): string {
  return props.axes
    .map((_, index) => {
      const point = vertex(index, (RADIUS * ring) / MAX.value);

      return `${point.x},${point.y}`;
    })
    .join(' ');
}

const dataVertices = computed(() =>
  displayedValues.value.map((value, index) =>
    vertex(index, (RADIUS * Math.min(value, MAX.value)) / MAX.value)
  )
);

const dataPoints = computed(() =>
  dataVertices.value.map((point) => `${point.x},${point.y}`).join(' ')
);

function labelAnchor(index: number) {
  return vertex(index, RADIUS + ICON_OFFSET);
}
</script>
