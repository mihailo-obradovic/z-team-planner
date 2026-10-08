<template>
  <!-- * At every width the banner says what is on screen: a badge in the header, a compact label in the mobile bottom bar (feature 001). -->
  <span
    v-if="block"
    class="shrink-0 font-heading text-label text-secondary-300 uppercase"
  >
    Shared build
  </span>

  <u-badge v-else color="info" variant="solid" size="sm">
    Viewing shared build
  </u-badge>

  <!-- * Save's unsaved-changes treatment once the snapshot has been edited: the edits are the visitor's work. -->
  <u-tooltip :text="copyLabel" :disabled="showLabels">
    <u-button
      :size="size"
      :variant="hasUnsavedChanges ? 'solid' : 'subtle'"
      :color="hasUnsavedChanges ? 'warning' : 'neutral'"
      icon="i-lucide-copy"
      :label="showLabels ? 'Save a copy' : undefined"
      :aria-label="copyAriaLabel"
      :block="block"
      :loading="isCreating || !isDestinationKnown"
      @click="saveCopy"
    />
  </u-tooltip>

  <u-tooltip v-if="openBuild" text="Back to my build" :disabled="showLabels">
    <u-button
      :size="size"
      variant="subtle"
      color="neutral"
      icon="i-lucide-undo-2"
      :label="showLabels ? 'Back to my build' : undefined"
      :aria-label="showLabels ? undefined : 'Back to my build'"
      :block="block"
      @click="guardDiscard(backToMyBuild)"
    />
  </u-tooltip>
</template>

<script setup lang="ts">
import {
  useCreateBuild,
  useFetchBuild
} from '@/services/queries/useBuildQueries';

import type { BuildLocation } from '@/composables/build/useBuildToast';

// * Shared-build mode's controls (feature 001): a `?build=` snapshot is on screen and nothing is open, though the build open before is remembered for Back to my build.

const props = defineProps<{
  labelled: boolean;
  block: boolean;
  size: 'md' | 'lg';
}>();

// * Icons only in the mobile bottom bar, as Save is there: the "Shared build" label and Share leave no room for two labelled buttons.
const showLabels = computed(() => props.labelled && !props.block);

const { reportBuild } = useBuildToast();
const plannerState = usePlannerState();

const { isSignedIn, isDestinationKnown } = storeToRefs(useAuthStore());
const { openBuild, openCloudId, openCloud } = useOpenBuild();
const { saveAsNewLocalBuild, backToMyBuild: backToLocalBuild } =
  useLocalBuilds();
const { leaveSharedMode, loadAccountBuild } = useBuildMode();
const { clearUrlParam } = useBuildSharing();
const { hasUnsavedChanges, updateSavedSnapshot } = useUnsavedChanges();
const { guardDiscard } = useDiscardGuard();

const { data: openedAccountBuild, refetch: refetchAccountBuild } =
  useFetchBuild(openCloudId);

const copyLabel = computed(() =>
  isSignedIn.value
    ? 'Save a copy to your account'
    : 'Save a copy to this browser'
);

const copyAriaLabel = computed(() =>
  hasUnsavedChanges.value
    ? `${copyLabel.value} — unsaved changes`
    : copyLabel.value
);

const { mutate: createCloudBuild, isLoading: isCreating } = useCreateBuild({
  onSuccess: (created, { data }) => {
    openCloud(created.id);
    settleOnCopy();
    updateSavedSnapshot(data);
    reportCopy(created.name, 'cloud');
  }
});

// * One click, no dialog: a snapshot carries no name, so the copy takes the default; edits made to it are kept, so nothing is discarded.
function saveCopy() {
  if (isCreating.value || !isDestinationKnown.value) {
    return;
  }

  if (isSignedIn.value) {
    createCloudBuild({
      name: DEFAULT_BUILD_NAME,
      data: serializeBuild(plannerState)
    });

    return;
  }

  reportCopy(saveAsNewLocalBuild(DEFAULT_BUILD_NAME), 'local');
}

function settleOnCopy() {
  leaveSharedMode();
  clearUrlParam();
}

function reportCopy(name: string, location: BuildLocation) {
  reportBuild('copied', name, location);
}

async function backToMyBuild() {
  if (!openCloudId.value) {
    await backToLocalBuild();

    return;
  }

  // * The menu that normally loads a cloud build is not mounted in this mode, so its document is read here.
  const cloudBuild =
    openedAccountBuild.value ?? (await refetchAccountBuild()).data;

  // * A failed read is reported by the central policy; the snapshot stays on screen.
  if (!cloudBuild) {
    return;
  }

  await loadAccountBuild(cloudBuild.data);
  clearUrlParam();
  updateSavedSnapshot();
}
</script>
