<template>
  <div class="flex items-center gap-2">
    <div :class="clusterClass">
      <template v-if="isViewingSharedBuild">
        <u-badge color="info" variant="solid" size="sm" class="max-md:hidden">
          Viewing shared build
        </u-badge>

        <u-tooltip text="Save as mine" :disabled="labelled">
          <u-button
            :size="size"
            variant="subtle"
            color="neutral"
            icon="i-lucide-save"
            :label="labelled ? 'Save as mine' : undefined"
            :aria-label="labelled ? undefined : 'Save as mine'"
            :block="block"
            @click="openSaveShared"
          />
        </u-tooltip>

        <u-tooltip text="Back to my build" :disabled="labelled">
          <u-button
            v-if="localBuilds.length > 0"
            :size="size"
            variant="subtle"
            color="neutral"
            icon="i-lucide-undo-2"
            :label="labelled ? 'Back to my build' : undefined"
            :aria-label="labelled ? undefined : 'Back to my build'"
            :block="block"
            @click="backToMyBuild"
          />
        </u-tooltip>
      </template>

      <template v-else>
        <u-tooltip :text="saveLabel" :disabled="saveLabelled">
          <u-button
            v-if="hasUnsavedChanges || localBuilds.length === 0"
            :size="size"
            :variant="hasUnsavedChanges ? 'solid' : 'subtle'"
            :color="hasUnsavedChanges ? 'warning' : 'neutral'"
            icon="i-lucide-save"
            :label="saveLabelled ? 'Save' : undefined"
            :aria-label="saveLabel"
            @click="handleSave"
          />
        </u-tooltip>

        <BuildMenu :tier="tier" :size="size" :block="block" />
      </template>
    </div>

    <u-tooltip text="Share" :disabled="labelled">
      <u-button
        :size="size"
        variant="solid"
        color="primary"
        icon="i-lucide-share-2"
        :label="labelled ? 'Share' : undefined"
        :aria-label="labelled ? undefined : 'Share'"
        :block="block"
        :class="block ? 'min-w-0 flex-1 basis-0' : undefined"
        @click="handleShare"
      />
    </u-tooltip>
  </div>
</template>

<script setup lang="ts">
import { useUpdateBuild } from '@/services/queries/useBuildQueries';

import type { HeaderTier } from '@/types/header';

const props = withDefaults(
  defineProps<{
    labelled?: boolean;
    block?: boolean;
    size?: 'md' | 'lg';
    tier?: HeaderTier;
  }>(),
  { labelled: true, block: false, size: 'md', tier: 'labelled' }
);

const toast = useToast();

const { activeAccountBuildId } = storeToRefs(useAuthStore());

const { mutate: patchBuild } = useUpdateBuild({
  onSuccess: (updated, { payload }) => {
    updateSavedSnapshot(payload.data);
    toast.add({ title: `Saved "${updated.name}"`, color: 'success' });
  }
});

const plannerState = usePlannerState();

const { localBuilds, saveLocalBuild, backToMyBuild } = useLocalBuilds();

const { isViewingSharedBuild } = useBuildMode();
const { shareBuild } = useBuildSharing();
const { hasUnsavedChanges, updateSavedSnapshot } = useUnsavedChanges();

const { saveSharedOpen, openNewBuild } = useDialogs();

const { handleShare } = useShareFlow();

const saveLabel = computed(() =>
  hasUnsavedChanges.value ? 'Save — unsaved changes' : 'Save'
);

const saveLabelled = computed(() => props.labelled && !props.block);

// * The shared-build branch is a row of its own in the action bar; everywhere else the controls sit directly in the bar's own row.
const clusterClass = computed(() =>
  props.block && isViewingSharedBuild.value
    ? 'flex min-w-0 flex-1 basis-0 items-center gap-2'
    : 'contents'
);

function openSaveShared() {
  saveSharedOpen.value = true;
}

function handleSave() {
  if (activeAccountBuildId.value) {
    patchBuild({
      id: activeAccountBuildId.value,
      payload: { data: serializeBuild(plannerState) }
    });

    return;
  }

  if (localBuilds.value.length === 0) {
    openNewBuild('Build 1');

    return;
  }

  saveLocalBuild();
  toast.add({ title: 'Build saved', color: 'success' });
}

// * An account build with unsaved changes is saved first, so the link never points at a stale version.
function useShareFlow() {
  const { mutate: patchThenShare } = useUpdateBuild({
    onSuccess: async (updated, { payload }) => {
      updateSavedSnapshot(payload.data);
      reportShare(
        (await copyAccountBuildLink(updated.id)) ? 'saved-and-copied' : 'failed'
      );
    }
  });

  async function handleShare() {
    const accountBuildId = activeAccountBuildId.value;

    if (!accountBuildId) {
      reportShare((await shareBuild()) ? 'copied' : 'failed');

      return;
    }

    if (hasUnsavedChanges.value) {
      patchThenShare({
        id: accountBuildId,
        payload: { data: serializeBuild(plannerState) }
      });

      return;
    }

    reportShare(
      (await copyAccountBuildLink(accountBuildId)) ? 'copied' : 'failed'
    );
  }

  function reportShare(outcome: 'copied' | 'saved-and-copied' | 'failed') {
    const titles = {
      copied: 'Link copied to clipboard',
      'saved-and-copied': 'Saved, and link copied to clipboard',
      failed: 'Failed to copy link'
    };

    toast.add({
      title: titles[outcome],
      color: outcome === 'failed' ? 'error' : 'success'
    });
  }

  async function copyAccountBuildLink(id: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(
        new URL(`/b/${id}`, window.location.origin).toString()
      );

      return true;
    } catch {
      return false;
    }
  }

  return { handleShare };
}
</script>
