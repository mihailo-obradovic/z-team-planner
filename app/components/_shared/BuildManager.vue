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
            v-if="savedBuilds.length > 0"
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
            v-if="hasUnsavedChanges || savedBuilds.length === 0"
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
          v-if="savedBuilds.length > 0"
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
            :ui="{ label: 'truncate' }"
          >
            {{ activeBuildName }}
          </u-button>
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
import type { DropdownMenuItem } from '@nuxt/ui';

const props = withDefaults(
  defineProps<{
    labelled?: boolean;
    block?: boolean;
    size?: 'md' | 'lg';
  }>(),
  { labelled: true, block: false, size: 'md' }
);

const toast = useToast();

const {
  savedBuilds,
  activeBuildId,
  activeBuildName,
  isViewingSharedBuild,
  hasUnsavedChanges,
  saveBuild,
  loadBuild,
  shareBuild,
  backToMyBuild
} = useHeroPlanner();

const { saveSharedOpen, deleteOpen, openNewBuild, openRename } =
  useBuildDialogs();

const saveLabel = computed(() =>
  hasUnsavedChanges.value ? 'Save \u2014 unsaved changes' : 'Save'
);

const saveLabelled = computed(() => props.labelled && !props.block);

const buildMenuItems = computed<DropdownMenuItem[][]>(() => {
  const builds = savedBuilds.value.map(
    (build: { id: string; name: string }) => ({
      label: build.name,
      icon: build.id === activeBuildId.value ? 'i-lucide-check' : undefined,
      onSelect: () => {
        loadBuild(build.id);
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

  // * Deleting the last remaining build would leave the selector with nothing to
  // * select and no way back, so it is offered only from the second build on.
  if (savedBuilds.value.length > 1 && activeBuildId.value) {
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

  return [builds, management];
});

function openSaveShared() {
  saveSharedOpen.value = true;
}

function handleSave() {
  if (savedBuilds.value.length === 0) {
    openNewBuild('Build 1');
    return;
  }

  saveBuild();
  toast.add({ title: 'Build saved', color: 'success' });
}

async function handleShare() {
  const success = await shareBuild();

  toast.add(
    success
      ? { title: 'Link copied to clipboard', color: 'success' }
      : { title: 'Failed to copy link', color: 'error' }
  );
}
</script>
