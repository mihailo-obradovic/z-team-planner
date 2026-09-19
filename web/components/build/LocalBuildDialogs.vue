<template>
  <BuildNameDialog
    v-model:open="saveSharedOpen"
    v-model:name="newBuildName"
    title="Save as my build"
    confirm-label="Save"
    placeholder="My build"
    :error="nameError"
    :disabled="isNameInvalid"
    @confirm="confirmSaveShared"
  />

  <BuildNameDialog
    v-model:open="newBuildOpen"
    v-model:name="newBuildName"
    title="New build"
    confirm-label="Create"
    placeholder="My build"
    :error="nameError"
    :disabled="isNameInvalid"
    @confirm="confirmNewBuild"
  />

  <u-modal
    v-model:open="deleteOpen"
    title="Delete build"
    description="Removes this build from this browser."
  >
    <template #body>
      <p class="text-sm text-muted">
        Are you sure you want to delete "{{ activeBuildName }}"?
      </p>
    </template>

    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <u-button variant="ghost" color="neutral" @click="closeDelete">
          Cancel
        </u-button>

        <u-button color="error" @click="confirmDelete">Delete</u-button>
      </div>
    </template>
  </u-modal>

  <BuildNameDialog
    v-model:open="renameOpen"
    v-model:name="renameBuildName"
    title="Rename build"
    confirm-label="Rename"
    @confirm="confirmRename"
  />
</template>

<script setup lang="ts">
import BuildNameDialog from '@/components/build/BuildNameDialog.vue';

const toast = useToast();

const {
  activeBuildId,
  activeBuildName,
  saveAsNewLocalBuild,
  deleteLocalBuild,
  loadLocalBuild,
  renameLocalBuild,
  localBuilds
} = useLocalBuilds();

const {
  saveSharedOpen,
  newBuildOpen,
  deleteOpen,
  renameOpen,
  newBuildName,
  renameBuildName
} = useDialogs();

const { r$: nameForm } = useBuildNameForm(newBuildName, { requireName: false });

const nameError = computed(() => nameForm.$errors.name?.[0]);

const isNameInvalid = computed(() => nameForm.$invalid);

function confirmSaveShared() {
  if (nameForm.$invalid) {
    return;
  }

  const name = newBuildName.value.trim() || 'Imported build';

  saveAsNewLocalBuild(name);
  saveSharedOpen.value = false;
  newBuildName.value = '';
  toast.add({ title: `Saved as "${name}"`, color: 'success' });
}

function confirmNewBuild() {
  if (nameForm.$invalid) {
    return;
  }

  const name = newBuildName.value.trim() || 'New build';

  saveAsNewLocalBuild(name);
  newBuildOpen.value = false;
  newBuildName.value = '';
  toast.add({ title: `Created "${name}"`, color: 'success' });
}

function closeDelete() {
  deleteOpen.value = false;
}

function confirmDelete() {
  if (!activeBuildId.value) {
    return;
  }

  const name = activeBuildName.value;

  deleteLocalBuild(activeBuildId.value);
  deleteOpen.value = false;

  if (localBuilds.value.length > 0) {
    loadLocalBuild(localBuilds.value[0]!.id);
  }

  toast.add({ title: `Deleted "${name}"`, color: 'neutral' });
}

function confirmRename() {
  if (!activeBuildId.value) {
    return;
  }

  const name = renameBuildName.value.trim();

  if (!name) {
    return;
  }

  renameLocalBuild(activeBuildId.value, name);
  renameOpen.value = false;
  renameBuildName.value = '';
}
</script>
