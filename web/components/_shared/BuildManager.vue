<template>
  <div class="flex items-center gap-2">
    <div
      :class="
        block && isViewingSharedBuild
          ? 'flex min-w-0 flex-1 basis-0 items-center gap-2'
          : 'contents'
      "
    >
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

        <u-dropdown-menu
          v-if="localBuilds.length > 0 || isSignedIn"
          v-model:open="isMenuOpen"
          :items="buildMenuItems"
          :ui="{ content: 'min-w-48' }"
          :class="block ? 'min-w-0 flex-1 basis-0' : undefined"
        >
          <u-button
            :size="size"
            variant="solid"
            color="secondary"
            trailing-icon="i-lucide-chevron-down"
            :block="block"
            :class="block ? undefined : 'max-w-40'"
            :label="displayName"
            :ui="{ label: 'truncate' }"
          />
        </u-dropdown-menu>
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
import {
  useFetchBuild,
  useFetchBuilds,
  useUpdateBuild
} from '@/services/queries/useBuildQueries';

import type { DropdownMenuItem } from '@nuxt/ui';
import type { HeaderTier } from '@/types/ui';

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

const { isSignedIn, activeAccountBuildId } = storeToRefs(useAuthStore());
const { setActiveAccountBuildId } = useAuthStore();

const plannerState = usePlannerState();

const {
  localBuilds,
  activeBuildId,
  activeBuildName,
  saveLocalBuild,
  loadLocalBuild,
  backToMyBuild
} = useLocalBuilds();

const { isViewingSharedBuild, loadAccountBuild } = useBuildMode();
const { shareBuild } = useBuildSharing();
const { hasUnsavedChanges, updateSavedSnapshot } = useUnsavedChanges();

const {
  buildMenuTier,
  saveSharedOpen,
  deleteOpen,
  accountDeleteOpen,
  openNewBuild,
  openRename,
  openAccountSave
} = useBuildDialogs();

const isMenuOpen = computed({
  get: () => buildMenuTier.value === props.tier,
  set: (open: boolean) => {
    buildMenuTier.value = open ? props.tier : null;
  }
});

const { data: accountBuilds, isPending: accountBuildsPending } =
  useFetchBuilds();

const { data: openedAccountBuild } = useFetchBuild(activeAccountBuildId);

const activeAccountBuild = computed(() =>
  accountBuilds.value?.items.find(
    (build) => build.id === activeAccountBuildId.value
  )
);

const displayName = computed(
  () => activeAccountBuild.value?.name ?? activeBuildName.value
);

const { mutate: patchBuild } = useUpdateBuild({
  // * Baselined against the document that was sent, so an edit made while the request was in
  // * flight is still reported as unsaved.
  onSuccess: (updated, { payload }) => {
    updateSavedSnapshot(payload.data);
    toast.add({ title: `Saved "${updated.name}"`, color: 'success' });
  }
});

// * Its own mutation rather than a mode flag on the one above: the two differ only in what they do
// * once the save lands, and sequencing it here keeps the component free of the try-catch the data
// * layer owns (feature 006). A failed save never reaches `onSuccess`, so nothing is copied and the
// * central policy reports it — a 412 as the conflict dialog.
const { mutate: patchThenShare } = useUpdateBuild({
  onSuccess: async (updated, { payload }) => {
    updateSavedSnapshot(payload.data);
    reportShare(
      (await copyAccountBuildLink(updated.id)) ? 'saved-and-copied' : 'failed'
    );
  }
});

const saveLabel = computed(() =>
  hasUnsavedChanges.value ? 'Save \u2014 unsaved changes' : 'Save'
);

const saveLabelled = computed(() => props.labelled && !props.block);

const buildMenuItems = computed<DropdownMenuItem[][]>(() => {
  const builds = localBuilds.value.map(
    (build: { id: string; name: string }) => ({
      label: build.name,
      icon: build.id === activeBuildId.value ? 'i-lucide-check' : undefined,
      onSelect: () => {
        loadLocalBuild(build.id);
      }
    })
  );

  const management: DropdownMenuItem[] = [
    {
      label: 'New build...',
      icon: 'i-lucide-plus',
      class: 'uppercase',
      onSelect: () => openNewBuild('')
    },
    {
      label: 'Rename...',
      icon: 'i-lucide-pencil',
      class: 'uppercase',
      onSelect: () => openRename(activeBuildName.value)
    }
  ];

  if (localBuilds.value.length > 1 && activeBuildId.value) {
    management.push({
      label: 'Delete...',
      icon: 'i-lucide-trash-2',
      color: 'error',
      class: 'uppercase',
      onSelect: () => {
        deleteOpen.value = true;
      }
    });
  }

  if (!isSignedIn.value) {
    const hint: DropdownMenuItem[] = [
      {
        label: 'Sign in to keep your builds stored securely',
        icon: 'i-lucide-cloud-off',
        class: 'whitespace-normal',
        type: 'label'
      }
    ];

    return [builds, management, hint];
  }

  const account: DropdownMenuItem[] = accountBuildsPending.value
    ? [
        {
          label: 'Loading your builds...',
          icon: 'i-lucide-loader',
          disabled: true
        }
      ]
    : (accountBuilds.value?.items ?? []).map((build) => ({
        label: build.name,
        icon:
          build.id === activeAccountBuildId.value
            ? 'i-lucide-check'
            : 'i-lucide-cloud',
        onSelect: () => {
          void openAccountBuild(build.id);
        }
      }));

  const accountActions: DropdownMenuItem[] = [
    {
      label: 'Save to account...',
      icon: 'i-lucide-cloud-upload',
      class: 'uppercase',
      onSelect: () => openAccountSave(displayName.value)
    }
  ];

  if (activeAccountBuildId.value) {
    accountActions.push({
      label: 'Delete from account...',
      icon: 'i-lucide-cloud-off',
      color: 'error',
      class: 'uppercase',
      onSelect: () => {
        accountDeleteOpen.value = true;
      }
    });
  }

  return [builds, account, accountActions, management];
});

// * Selecting records which build is open and the load watcher fills the planner from it.
// ! Re-selecting the build already open changes neither the query key nor its data, so that
// ! watcher never fires — without this branch, picking the open build to discard local edits
// ! would silently do nothing. Reads the cached document, never the network (feature 008).
async function openAccountBuild(id: string) {
  if (id !== activeAccountBuildId.value) {
    setActiveAccountBuildId(id);

    return;
  }

  const opened = openedAccountBuild.value;

  if (opened) {
    await loadAccountBuild(opened.data);
    updateSavedSnapshot();
  }
}

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

// * An account build shares as a live link: `/b/{id}` always shows the owner's current document,
// * where `?build=` freezes whatever was on screen when it was copied (feature 007). A local build
// * has no id on the server, so it keeps the snapshot.
async function handleShare() {
  const accountBuildId = activeAccountBuildId.value;

  if (!accountBuildId) {
    reportShare((await shareBuild()) ? 'copied' : 'failed');

    return;
  }

  // ! Save first. A live link resolves to the stored document, so sharing a build with unsaved
  // ! edits hands out a link to something the sharer is not looking at.
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

// * The implicit save is named in the message: a player who pressed Share and got a silent write
// * to their stored build has to be told it happened.
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

// * Opening a cloud build re-baselines dirty tracking: the planner holds that document now, so
// * Save and the unload guard describe it rather than the local build that was open before.
// * The baseline is taken from the planner after deserialising, never from `build.data` — see
// * the note on `updateSavedSnapshot`.
watch(openedAccountBuild, async (build) => {
  if (build) {
    await loadAccountBuild(build.data);
    updateSavedSnapshot();
  }
});
</script>
