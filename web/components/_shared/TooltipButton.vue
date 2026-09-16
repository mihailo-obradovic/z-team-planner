<template>
  <!-- * This click handler runs after the parent's fallthrough one, so the confirmation reads the resulting state. -->
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
      :swap-key="swapKey"
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
    swapKey?: string | number;
    // * Called after the click with the resulting state applied; null shows nothing.
    confirmation?: () => string | null;
  }>(),
  { size: 'xs' }
);

const mode = useInputMode();

// * Shared across chips, so tapping one closes another's line instead of stacking.
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

// * `undefined` leaves `UTooltip`'s own hover behaviour untouched.
const controlledOpen = computed(() =>
  mode.value === 'no-hover' ? isOpen.value : undefined
);

const delayDuration = computed(() =>
  mode.value === 'no-hover' ? 0 : undefined
);

async function handleClick() {
  if (mode.value !== 'no-hover' || !props.confirmation) {
    return;
  }

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

watch(activeHolder, (holder) => {
  if (holder !== holderId) {
    isOpen.value = false;
  }
});

onUnmounted(() => clearTimeout(timer));
</script>
