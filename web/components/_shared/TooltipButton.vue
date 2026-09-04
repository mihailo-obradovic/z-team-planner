<template>
  <!-- * The click handler here is merged with the parent's own click fallthrough (see IconButton): a no-hover tap both performs the parent's action and, on this component's own handler, reads the resulting state for the confirmation (feature 018). -->
  <u-tooltip
    :text="displayedText"
    :open="controlledOpen"
    :delay-duration="delayDuration"
    :disable-closing-trigger="mode === 'no-hover'"
    @click="handleClick"
  >
    <IconButton
      :label="text"
      :icon="icon"
      :color="color"
      :size="size"
      :disabled="disabled"
      :active="active"
    />
  </u-tooltip>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    text: string;
    icon: string;
    color?: 'primary' | 'secondary' | 'neutral';
    size?: 'xs' | 'sm';
    disabled?: boolean;
    active?: boolean;
    // * Called after the click resolves, with the chip's resulting state already applied; a null return shows nothing (feature 018 — every deactivation).
    confirmation?: () => string | null;
  }>(),
  { size: 'xs' }
);

const mode = useInputMode();

// * Shared across every chip so a tap on chip B closes chip A's line rather than stacking a second one.
const activeHolder = useState<symbol | null>(
  'tooltip-button-active-holder',
  () => null
);
const holderId = Symbol('tooltip-button');

const shownText = ref<string | null>(null);
const isOpen = ref(false);
let timer: ReturnType<typeof setTimeout> | undefined;

const displayedText = computed(() =>
  mode.value === 'no-hover' ? (shownText.value ?? props.text) : props.text
);
// * `undefined` leaves `UTooltip` uncontrolled in hover mode, so the library's own hover-open behaviour is untouched.
const controlledOpen = computed(() =>
  mode.value === 'no-hover' ? isOpen.value : undefined
);
const delayDuration = computed(() =>
  mode.value === 'no-hover' ? 0 : undefined
);

watch(activeHolder, (holder) => {
  if (holder !== holderId) {
    isOpen.value = false;
  }
});

onUnmounted(() => clearTimeout(timer));

async function handleClick() {
  if (mode.value !== 'no-hover' || !props.confirmation) {
    return;
  }

  // * The store's toggle handler runs on the same click before this one; the confirmation reads its result.
  await nextTick();

  const line = props.confirmation();

  if (line === null) {
    return;
  }

  shownText.value = line;
  activeHolder.value = holderId;
  isOpen.value = true;

  clearTimeout(timer);
  timer = setTimeout(() => {
    isOpen.value = false;
  }, lingerMs());
}

function lingerMs(): number {
  const FALLBACK_MS = 1500;

  if (!import.meta.client) {
    return FALLBACK_MS;
  }

  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue('--duration-linger')
    .trim();
  const parsed = parseFloat(raw);

  if (Number.isNaN(parsed)) {
    return FALLBACK_MS;
  }

  return raw.endsWith('ms') ? parsed : parsed * 1000;
}
</script>
