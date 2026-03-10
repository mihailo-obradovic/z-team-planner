<template>
  <div class="flex items-center gap-1.5">
    <!-- Shared build banner -->
    <template v-if="isViewingSharedBuild">
      <UBadge color="info" variant="subtle" size="sm">
        Viewing shared build
      </UBadge>

      <UButton
        size="xs"
        variant="soft"
        icon="i-lucide-save"
        @click="showSaveSharedDialog = true"
      >
        Save as mine
      </UButton>

      <UButton
        v-if="hasSavedBuilds"
        size="xs"
        variant="ghost"
        color="neutral"
        icon="i-lucide-undo-2"
        @click="handleBackToMyBuild"
      >
        Back to my build
      </UButton>
    </template>

    <!-- Normal mode -->
    <template v-else>
      <!-- Build selector -->
      <UDropdownMenu
        v-if="savedBuilds.length > 0"
        :items="buildMenuItems"
        :ui="{ content: 'min-w-48' }"
      >
        <UButton
          size="xs"
          variant="subtle"
          color="neutral"
          trailing-icon="i-lucide-chevron-down"
        >
          {{ activeBuildName }}
        </UButton>
      </UDropdownMenu>

      <!-- Unsaved changes indicator -->
      <UBadge
        v-if="hasUnsavedChanges"
        color="warning"
        variant="subtle"
        size="sm"
      >
        Unsaved changes
      </UBadge>

      <!-- Save button -->
      <UButton
        v-if="hasUnsavedChanges || savedBuilds.length === 0"
        size="xs"
        variant="soft"
        icon="i-lucide-save"
        @click="handleSave"
      >
        {{ savedBuilds.length === 0 ? 'Save' : '' }}
      </UButton>

      <!-- New build -->
      <UButton
        v-if="savedBuilds.length > 0"
        size="xs"
        variant="ghost"
        color="neutral"
        icon="i-lucide-plus"
        @click="showNewBuildDialog = true"
      />

      <!-- Delete build -->
      <UButton
        v-if="savedBuilds.length > 1 && activeBuildId"
        size="xs"
        variant="ghost"
        color="neutral"
        icon="i-lucide-trash-2"
        @click="showDeleteDialog = true"
      />
    </template>

    <!-- Share button (always visible) -->
    <UButton
      size="xs"
      variant="ghost"
      color="neutral"
      icon="i-lucide-share-2"
      @click="handleShare"
    />

    <!-- Save shared build dialog -->
    <UModal v-model:open="showSaveSharedDialog">
      <template #content>
        <div class="p-4 flex flex-col gap-4">
          <h3 class="text-lg font-medium">Save as my build</h3>

          <UFormField label="Build name">
            <UInput
              v-model="newBuildName"
              placeholder="My build"
              autofocus
              @keydown.enter="confirmSaveShared"
            />
          </UFormField>

          <div class="flex justify-end gap-2">
            <UButton
              variant="ghost"
              color="neutral"
              @click="showSaveSharedDialog = false"
            >
              Cancel
            </UButton>

            <UButton @click="confirmSaveShared">
              Save
            </UButton>
          </div>
        </div>
      </template>
    </UModal>

    <!-- New build dialog -->
    <UModal v-model:open="showNewBuildDialog">
      <template #content>
        <div class="p-4 flex flex-col gap-4">
          <h3 class="text-lg font-medium">New build</h3>

          <UFormField label="Build name">
            <UInput
              v-model="newBuildName"
              placeholder="My build"
              autofocus
              @keydown.enter="confirmNewBuild"
            />
          </UFormField>

          <div class="flex justify-end gap-2">
            <UButton
              variant="ghost"
              color="neutral"
              @click="showNewBuildDialog = false"
            >
              Cancel
            </UButton>

            <UButton @click="confirmNewBuild">
              Create
            </UButton>
          </div>
        </div>
      </template>
    </UModal>

    <!-- Delete confirmation dialog -->
    <UModal v-model:open="showDeleteDialog">
      <template #content>
        <div class="p-4 flex flex-col gap-4">
          <h3 class="text-lg font-medium">Delete build</h3>

          <p class="text-sm text-muted">
            Are you sure you want to delete "{{ activeBuildName }}"?
          </p>

          <div class="flex justify-end gap-2">
            <UButton
              variant="ghost"
              color="neutral"
              @click="showDeleteDialog = false"
            >
              Cancel
            </UButton>

            <UButton color="error" @click="confirmDelete">
              Delete
            </UButton>
          </div>
        </div>
      </template>
    </UModal>

    <!-- Rename dialog -->
    <UModal v-model:open="showRenameDialog">
      <template #content>
        <div class="p-4 flex flex-col gap-4">
          <h3 class="text-lg font-medium">Rename build</h3>

          <UFormField label="Build name">
            <UInput
              v-model="renameBuildName"
              autofocus
              @keydown.enter="confirmRename"
            />
          </UFormField>

          <div class="flex justify-end gap-2">
            <UButton
              variant="ghost"
              color="neutral"
              @click="showRenameDialog = false"
            >
              Cancel
            </UButton>

            <UButton @click="confirmRename">
              Rename
            </UButton>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
const toast = useToast();

// ---

const {
  savedBuilds,
  activeBuildId,
  isViewingSharedBuild,
  hasUnsavedChanges,
  saveBuild,
  saveAsNewBuild,
  loadBuild,
  deleteBuild,
  renameBuild,
  shareBuild
} = useHeroPlanner();

// ---

const hasSavedBuilds = computed(() => savedBuilds.value.length > 0);

const activeBuildName = computed(() => {
  const build = savedBuilds.value.find(
    (b: { id: string }) => b.id === activeBuildId.value
  );
  return build?.name ?? 'Untitled';
});

// --- Dialogs ---

const showSaveSharedDialog = ref(false);
const showNewBuildDialog = ref(false);
const showDeleteDialog = ref(false);
const showRenameDialog = ref(false);
const newBuildName = ref('');
const renameBuildName = ref('');

// --- Build menu ---

const buildMenuItems = computed(() => {
  const items = savedBuilds.value.map((build: { id: string; name: string }) => ({
    label: build.name,
    icon: build.id === activeBuildId.value ? 'i-lucide-check' : undefined,
    onSelect: () => { loadBuild(build.id); }
  }));

  items.push({
    label: 'Rename...',
    icon: 'i-lucide-pencil',
    onSelect: () => {
      renameBuildName.value = activeBuildName.value;
      showRenameDialog.value = true;
    }
  });

  return items;
});

// --- Handlers ---

function handleSave() {
  if (savedBuilds.value.length === 0) {
    showNewBuildDialog.value = true;
    newBuildName.value = 'Build 1';
    return;
  }

  saveBuild();
  toast.add({ title: 'Build saved', color: 'success' });
}

function handleBackToMyBuild() {
  const { backToMyBuild } = useHeroPlanner();
  backToMyBuild();
}

async function handleShare() {
  const success = await shareBuild();

  if (success) {
    toast.add({ title: 'Link copied to clipboard', color: 'success' });
  } else {
    toast.add({ title: 'Failed to copy link', color: 'error' });
  }
}

function confirmSaveShared() {
  const name = newBuildName.value.trim() || 'Imported build';
  const { saveSharedAsMyBuild } = useHeroPlanner();

  saveSharedAsMyBuild(name);
  showSaveSharedDialog.value = false;
  newBuildName.value = '';
  toast.add({ title: `Saved as "${name}"`, color: 'success' });
}

function confirmNewBuild() {
  const name = newBuildName.value.trim() || 'New build';

  saveAsNewBuild(name);
  showNewBuildDialog.value = false;
  newBuildName.value = '';
  toast.add({ title: `Created "${name}"`, color: 'success' });
}

function confirmDelete() {
  if (!activeBuildId.value) return;

  const name = activeBuildName.value;

  deleteBuild(activeBuildId.value);
  showDeleteDialog.value = false;

  // Load the next available build
  if (savedBuilds.value.length > 0) {
    loadBuild(savedBuilds.value[0]!.id);
  }

  toast.add({ title: `Deleted "${name}"`, color: 'neutral' });
}

function confirmRename() {
  if (!activeBuildId.value) return;

  const name = renameBuildName.value.trim();
  if (!name) return;

  renameBuild(activeBuildId.value, name);
  showRenameDialog.value = false;
  renameBuildName.value = '';
}
</script>
