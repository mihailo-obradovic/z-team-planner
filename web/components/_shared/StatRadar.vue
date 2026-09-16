<template>
  <!-- * One `role="img"` graphic: its numbers are already real text in the stat rows beside it. -->
  <!-- ! `block max-w-full` is load-bearing: WebKit gives a `viewBox` SVG a 320px min-content width, which scrolls the dialog's mobile column sideways on iOS. -->
  <svg
    :viewBox="`0 0 ${WIDTH} ${HEIGHT}`"
    class="block h-full w-full max-w-full select-none"
    role="img"
    :aria-labelledby="`${uid}-title ${uid}-desc`"
    preserveAspectRatio="xMidYMid meet"
  >
    <title :id="`${uid}-title`">{{ title }}</title>

    <desc :id="`${uid}-desc`">{{ description }}</desc>

    <!-- * Drawn outermost first, so the spokes and the data sit above them. -->
    <polygon
      v-for="ring in rings"
      :key="ring"
      :points="ringPoints(ring)"
      fill="none"
      :stroke="ring === max ? 'var(--ui-border)' : 'var(--ui-border-muted)'"
      :stroke-width="ring === max ? 2 : 1"
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

    <!-- * Ink and dashed, so the required shape differs from the team's by pattern as well as colour. -->
    <polygon
      v-if="referencePoints"
      :points="referencePoints"
      fill="var(--ui-text)"
      fill-opacity="0.08"
      stroke="var(--ui-text)"
      stroke-width="2"
      stroke-dasharray="6 4"
      stroke-linejoin="round"
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

    <g
      v-for="marker in thresholdMarkers"
      :key="`marker-${marker.kind}-${marker.index}`"
    >
      <title>{{ marker.tooltip }}</title>

      <circle
        :cx="marker.x"
        :cy="marker.y"
        :r="marker.kind === 'fail' ? 12 : 16"
        :fill="marker.kind === 'fail' ? 'var(--ui-error)' : 'var(--ui-warning)'"
        stroke="var(--ui-text)"
        stroke-width="1.5"
      />

      <path
        v-if="marker.kind === 'fail'"
        :d="`M ${marker.x - 5} ${marker.y - 5} l 10 10 M ${marker.x + 5} ${marker.y - 5} l -10 10`"
        stroke="var(--ui-color-neutral-100)"
        stroke-width="2.5"
        stroke-linecap="round"
      />

      <text
        v-else
        :x="marker.x"
        :y="marker.y"
        text-anchor="middle"
        dominant-baseline="central"
        font-size="16"
        font-weight="700"
        fill="var(--ui-text)"
      >
        2×
      </text>
    </g>

    <!-- * Icons only: the stat rows already name each axis, and words shrank the polygon. -->
    <!-- ! Cream, not `text-inverted`: this project remaps inverted text to ink, which vanishes on an ink disc. -->
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
    // * The required shape, in axis order.
    reference?: number[];
    // * In axis order; 0 means none.
    failAt?: number[];
    xpAt?: number[];
  }>(),
  {
    max: 10,
    durationMs: 200
  }
);

// * Without word labels the box only has to clear a disc at each vertex.
const WIDTH = 320;
const HEIGHT = 320;
const CENTRE_X = WIDTH / 2;
const RADIUS = 118;
const ICON_BOX = 24;
const ICON_RADIUS = 17;
const ICON_OFFSET = 28;

const rings = computed(() => {
  const values: number[] = [];

  for (let value = 2; value <= props.max; value += 2) {
    values.push(value);
  }

  return values;
});

const uid = useId();

// * A quarter turn back from due east puts axis 0 at the apex, so nothing downstream rotates.
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

// ! Not `HEIGHT / 2`: an apex-up pentagon reaches further above its centre than below, so this centres the drawn extent, discs included.
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
      const point = vertex(index, (RADIUS * ring) / props.max);

      return `${point.x},${point.y}`;
    })
    .join(' ');
}

function valuePoint(index: number, value: number) {
  return vertex(index, (RADIUS * Math.min(value, props.max)) / props.max);
}

const dataVertices = computed(() =>
  displayedValues.value.map((value, index) => valuePoint(index, value))
);

const dataPoints = computed(() =>
  dataVertices.value.map((point) => `${point.x},${point.y}`).join(' ')
);

const referenceTargets = computed(() => props.reference ?? []);

const displayedReference = useTweenedValues(referenceTargets, props.durationMs);

const referencePoints = computed(() => {
  if (!props.reference) {
    return null;
  }

  return displayedReference.value
    .map((value, index) => {
      const point = valuePoint(index, value);

      return `${point.x},${point.y}`;
    })
    .join(' ');
});

const displayedFailAt = useTweenedValues(
  computed(() => props.failAt ?? []),
  props.durationMs
);

const displayedXpAt = useTweenedValues(
  computed(() => props.xpAt ?? []),
  props.durationMs
);

// * Follows the tween, so an edited threshold slides along its axis.
const thresholdMarkers = computed(() => {
  const markers: {
    kind: 'fail' | 'xp';
    index: number;
    x: number;
    y: number;
    tooltip: string;
  }[] = [];

  for (const [kind, targets, displayed] of [
    ['fail', props.failAt, displayedFailAt.value],
    ['xp', props.xpAt, displayedXpAt.value]
  ] as const) {
    targets?.forEach((target, index) => {
      if (target > 0) {
        const value = displayed[index] ?? target;
        const point = valuePoint(index, value);
        const axis = props.axes[index];
        const tooltip =
          kind === 'fail'
            ? `Fails when team ${axis?.label} reaches ${target}`
            : `Double XP when team ${axis?.label} reaches ${target}`;

        markers.push({ kind, index, x: point.x, y: point.y, tooltip });
      }
    });
  }

  return markers;
});

function labelAnchor(index: number) {
  return vertex(index, RADIUS + ICON_OFFSET);
}
</script>
