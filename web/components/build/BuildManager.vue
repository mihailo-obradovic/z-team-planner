<template>
  <div class="flex items-center gap-2">
    <div :class="clusterClass">
      <SharedBuildBanner
        v-if="isViewingSharedBuild"
        :labelled="labelled"
        :block="block"
        :size="size"
      />

      <template v-else>
        <!-- * Labelled or not, the tooltip stays: "Save" alone does not say where it writes. -->
        <u-tooltip :text="saveLabel">
          <u-button
            v-if="hasUnsavedChanges || !openBuild"
            :size="size"
            :variant="hasUnsavedChanges ? 'solid' : 'subtle'"
            :color="hasUnsavedChanges ? 'warning' : 'neutral'"
            icon="i-lucide-save"
            :label="saveLabelled ? 'Save' : undefined"
            :aria-label="saveAriaLabel"
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
import BuildMenu from '@/components/build/BuildMenu.vue';
import SharedBuildBanner from '@/components/build/SharedBuildBanner.vue';

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

const { openBuild, openLocalId, openCloudId, draftName } = useOpenBuild();
const { isSignedIn } = storeToRefs(useAuthStore());

const { mutate: patchBuild } = useUpdateBuild({
  onSuccess: (updated, { payload }) => {
    updateSavedSnapshot(payload.data);
    toast.add({ title: `Saved "${updated.name}"`, color: 'success' });
  }
});

const plannerState = usePlannerState();

const { saveLocalBuild } = useLocalBuilds();

const { isViewingSharedBuild } = useBuildMode();
const { shareBuild } = useBuildSharing();
const { hasUnsavedChanges, updateSavedSnapshot } = useUnsavedChanges();

const { openSaveAsNew, openAccountSave } = useDialogs();

const { handleShare } = useShareFlow();

// * Where Save writes: the open build's own home, else wherever a new build goes (feature 029).
const savesToAccount = computed(
  () => !!openCloudId.value || (!openLocalId.value && isSignedIn.value)
);

const saveLabel = computed(() =>
  savesToAccount.value ? 'Save to your account' : 'Save to this browser'
);

const saveAriaLabel = computed(() =>
  hasUnsavedChanges.value
    ? `${saveLabel.value} — unsaved changes`
    : saveLabel.value
);

const saveLabelled = computed(() => props.labelled && !props.block);

// * The shared-build branch is a row of its own in the action bar; everywhere else the controls sit directly in the bar's own row.
// * Two parts to Share's one: the label and two icon buttons do not fit in half a phone's width.
const clusterClass = computed(() =>
  props.block && isViewingSharedBuild.value
    ? 'flex min-w-0 flex-2 basis-0 items-center gap-2'
    : 'contents'
);

function handleSave() {
  if (openCloudId.value) {
    patchBuild({
      id: openCloudId.value,
      payload: { data: serializeBuild(plannerState) }
    });

    return;
  }

  if (!openLocalId.value) {
    if (isSignedIn.value) {
      openAccountSave(draftName.value);
    } else {
      openSaveAsNew(draftName.value);
    }

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
    const accountBuildId = openCloudId.value;

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
