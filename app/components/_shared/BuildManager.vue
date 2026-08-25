<template>
  <div class="flex items-center gap-2">
    <!-- Shared build banner -->
    <template v-if="isViewingSharedBuild">
      <!-- * Solid, not subtle: a subtle badge is its own hue on a near-paper tint, and both signal and gold fail AA that way (3.0:1 and worse). Solid puts ink on the fill instead. -->
      <u-badge color="info" variant="solid" size="sm" class="max-md:hidden">
        Viewing shared build
      </u-badge>

      <u-button
        :size="size"
        variant="soft"
        icon="i-lucide-save"
        :label="labelled ? 'Save as mine' : undefined"
        :aria-label="labelled ? undefined : 'Save as mine'"
        :block="block"
        @click="saveSharedOpen = true"
      />

      <u-button
        v-if="savedBuilds.length > 0"
        :size="size"
        variant="ghost"
        color="neutral"
        icon="i-lucide-undo-2"
        :label="labelled ? 'Back to my build' : undefined"
        :aria-label="labelled ? undefined : 'Back to my build'"
        :block="block"
        @click="backToMyBuild"
      />
    </template>

    <!-- Normal mode -->
    <template v-else>
      <u-button
        v-if="hasUnsavedChanges || savedBuilds.length === 0"
        :size="size"
        variant="soft"
        icon="i-lucide-save"
        :label="labelled ? 'Save' : undefined"
        :aria-label="labelled ? undefined : 'Save'"
        :block="block"
        @click="handleSave"
      />

      <!-- * The build selector doubles as the build menu: switching, renaming, creating and deleting are all build management, and giving each its own icon button is what crowded the header (feature 003, Story Setup drawer). -->
      <u-dropdown-menu
        v-if="savedBuilds.length > 0"
        :items="buildMenuItems"
        :ui="{ content: 'min-w-48' }"
        :class="block ? 'flex-1' : undefined"
      >
        <u-button
          :size="size"
          variant="subtle"
          color="neutral"
          trailing-icon="i-lucide-chevron-down"
          :block="block"
          class="max-w-40"
          :ui="{ label: 'truncate' }"
        >
          {{ activeBuildName }}
        </u-button>
      </u-dropdown-menu>

      <!-- * Not a badge on the button: unsaved state has to read at a glance next to Save, and a dot inside the label would be lost at the icon-only tier. -->
      <u-badge
        v-if="hasUnsavedChanges && savedBuilds.length > 0"
        color="warning"
        variant="solid"
        size="sm"
        class="max-lg:hidden"
      >
        Unsaved changes
      </u-badge>
    </template>

    <u-button
      :size="size"
      variant="ghost"
      color="neutral"
      icon="i-lucide-share-2"
      :label="labelled ? 'Share' : undefined"
      :aria-label="labelled ? undefined : 'Share'"
      :block="block"
      @click="handleShare"
    />
  </div>
</template>

<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui';

// ---

withDefaults(
  defineProps<{
    // * The tier ladder (annex §13) drops button labels a step before it drops
    // * information, so the same controls render labelled in the header at `lg`
    // * and up, icon-only at `md`, and labelled again in the mobile action bar
    // * where there is width for them.
    labelled?: boolean;
    // * The mobile action bar is three equal-width 44px buttons.
    block?: boolean;
    size?: 'xs' | 'lg';
  }>(),
  { labelled: true, block: false, size: 'xs' }
);

// ---

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

// ---

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
      onSelect: () => openNewBuild('')
    },
    {
      label: 'Rename...',
      icon: 'i-lucide-pencil',
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
      onSelect: () => {
        deleteOpen.value = true;
      }
    });
  }

  return [builds, management];
});

// ---

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
