<template>
  <u-modal v-model:open="saveSharedOpen" title="Save as my build">
    <template #body>
      <u-form-field label="Build name" :error="nameError">
        <u-input
          v-model="newBuildName"
          placeholder="My build"
          autofocus
          @keydown.enter="confirmSaveShared"
        />
      </u-form-field>
    </template>

    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <u-button variant="ghost" color="neutral" @click="closeSaveShared">
          Cancel
        </u-button>
        <u-button :disabled="isNameInvalid" @click="confirmSaveShared">
          Save
        </u-button>
      </div>
    </template>
  </u-modal>

  <u-modal v-model:open="newBuildOpen" title="New build">
    <template #body>
      <u-form-field label="Build name" :error="nameError">
        <u-input
          v-model="newBuildName"
          placeholder="My build"
          autofocus
          @keydown.enter="confirmNewBuild"
        />
      </u-form-field>
    </template>

    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <u-button variant="ghost" color="neutral" @click="closeNewBuild">
          Cancel
        </u-button>
        <u-button :disabled="isNameInvalid" @click="confirmNewBuild">
          Create
        </u-button>
      </div>
    </template>
  </u-modal>

  <u-modal v-model:open="deleteOpen" title="Delete build">
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

  <u-modal v-model:open="renameOpen" title="Rename build">
    <template #body>
      <u-form-field label="Build name">
        <u-input
          v-model="renameBuildName"
          autofocus
          @keydown.enter="confirmRename"
        />
      </u-form-field>
    </template>

    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <u-button variant="ghost" color="neutral" @click="closeRename">
          Cancel
        </u-button>
        <u-button @click="confirmRename">Rename</u-button>
      </div>
    </template>
  </u-modal>
</template>

<script setup lang="ts">
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
} = useBuildDialogs();

// * Only the length rule here: feature 001 documents an empty name as falling back to a generated one, and feature 008 leaves that behaviour alone.
const { r$: nameForm } = useBuildNameForm(newBuildName, { requireName: false });

const nameError = computed(() => nameForm.$errors.name?.[0]);

const isNameInvalid = computed(() => nameForm.$invalid);

function closeSaveShared() {
  saveSharedOpen.value = false;
}

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

function closeNewBuild() {
  newBuildOpen.value = false;
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

  // * Load the next available build
  if (localBuilds.value.length > 0) {
    loadLocalBuild(localBuilds.value[0]!.id);
  }

  toast.add({ title: `Deleted "${name}"`, color: 'neutral' });
}

function closeRename() {
  renameOpen.value = false;
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
