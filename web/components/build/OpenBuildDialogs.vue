<template>
  <BuildNameDialog
    v-model:open="renameOpen"
    v-model:name="renameBuildName"
    title="Rename build"
    confirm-label="Rename"
    :error="renameError"
    :disabled="renameForm.$invalid"
    :loading="isRenaming"
    @confirm="confirmRename"
  />

  <u-modal
    v-model:open="deleteOpen"
    title="Delete build"
    :description="deleteDescription"
    :content="dialogContent"
  >
    <template #body>
      <p class="text-sm text-muted">
        Delete
        <span class="font-semibold text-highlighted">{{ openBuildName }}</span>
        {{ openCloudId ? 'from your account?' : 'from this browser?' }}
        <template v-if="openCloudId"
          >Its share link will stop working.</template
        >
      </p>
    </template>

    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <u-button variant="ghost" color="neutral" @click="closeDelete">
          Cancel
        </u-button>

        <u-button color="error" :loading="isDeleting" @click="confirmDelete">
          Delete
        </u-button>
      </div>
    </template>
  </u-modal>
</template>

<script setup lang="ts">
import BuildNameDialog from '@/components/build/BuildNameDialog.vue';

import {
  useDeleteBuild,
  useUpdateBuild
} from '@/services/queries/useBuildQueries';

import type { BuildLocation } from '@/composables/build/useBuildToast';

// * Rename and Delete for the open build, whichever kind it is (feature 029): one of each, so the menu never offers a second pair for a build that is not open.

const { reportBuild } = useBuildToast();

const { openLocalId, openCloudId, closeDeletedBuild } = useOpenBuild();
const openBuildName = useOpenBuildName();

const { deleteLocalBuild, renameLocalBuild } = useLocalBuilds();
const { forgetSavedSnapshot } = useUnsavedChanges();

const { deleteOpen, renameOpen, renameBuildName, dialogContent } = useDialogs();

const deleteDescription = computed(() =>
  openCloudId.value
    ? 'Removes this build from your account and stops its share link.'
    : 'Removes this build from this browser.'
);

const {
  mutate: renameCloudBuild,
  isLoading: isRenaming,
  error: renameRequestError
} = useUpdateBuild({
  errorHandling: { suppressToasts: 'validation' },
  onSuccess: (updated) => {
    finishRename(updated.name, 'cloud');
  }
});

const { r$: renameForm } = useBuildNameForm(renameBuildName, {
  externalErrors: useExternalErrors(useValidationErrors(renameRequestError))
});

const renameError = computed(() => renameForm.$errors.name?.[0]);

const { mutate: deleteCloudBuild, isLoading: isDeleting } = useDeleteBuild({
  onSuccess: () => {
    const name = openBuildName.value;

    // * The local path does this inside `deleteLocalBuild`; a cloud build is only gone once the server says so.
    closeDeletedBuild(name);
    forgetSavedSnapshot();
    finishDelete(name, 'cloud');
  }
});

function confirmRename() {
  if (renameForm.$invalid) {
    return;
  }

  if (openCloudId.value) {
    renameCloudBuild({
      id: openCloudId.value,
      payload: { name: renameBuildName.value.trim() }
    });

    return;
  }

  if (openLocalId.value) {
    const name = renameLocalBuild(openLocalId.value, renameBuildName.value);

    if (name) {
      finishRename(name, 'local');
    }
  }
}

function finishRename(name: string, location: BuildLocation) {
  renameOpen.value = false;
  renameBuildName.value = '';
  reportBuild('renamed', name, location);
}

function closeDelete() {
  deleteOpen.value = false;
}

function confirmDelete() {
  if (openCloudId.value) {
    deleteCloudBuild(openCloudId.value);

    return;
  }

  if (openLocalId.value) {
    const name = openBuildName.value;

    deleteLocalBuild(openLocalId.value);
    finishDelete(name, 'local');
  }
}

function finishDelete(name: string, location: BuildLocation) {
  deleteOpen.value = false;
  reportBuild('deleted', name, location);
}
</script>
