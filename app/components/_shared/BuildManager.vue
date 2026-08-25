<template>
  <!-- ! Two grid tracks, not two `flex-1` children: `flex-1` is `flex: 1 1 0%`, and a percentage basis resolves against the content box, so Share's `px-4` is added on top of its share and the row splits 218/250 instead of in half. A `1fr` track is measured on the border box. -->
  <div
    :class="
      block
        ? 'grid grid-cols-2 items-center gap-2'
        : 'flex items-center gap-2'
    "
  >
    <!-- * In the mobile action bar the row splits in half: the save/build-selector cluster takes one track, Share the other, so the primary action keeps a constant width whatever the cluster is showing. In the header the group is transparent (`contents`) and the controls sit inline as before. -->
    <div :class="block ? 'flex min-w-0 items-center gap-2' : 'contents'">
      <!-- Shared build banner -->
      <template v-if="isViewingSharedBuild">
        <!-- * Solid, not subtle: a subtle badge is its own hue on a near-paper tint, and both signal and gold fail AA that way (3.0:1 and worse). Solid puts ink on the fill instead. -->
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
            @click="saveSharedOpen = true"
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

      <!-- Normal mode -->
      <template v-else>
        <u-tooltip text="Save" :disabled="labelled">
          <u-button
            v-if="hasUnsavedChanges || savedBuilds.length === 0"
            :size="size"
            variant="subtle"
            color="neutral"
            icon="i-lucide-save"
            :label="labelled ? 'Save' : undefined"
            :aria-label="labelled ? undefined : 'Save'"
            :block="block"
            @click="handleSave"
          />
        </u-tooltip>

        <!-- * The build selector doubles as the build menu: switching, renaming, creating and deleting are all build management, and giving each its own icon button is what crowded the header (feature 003, Story Setup drawer). -->
        <u-dropdown-menu
          v-if="savedBuilds.length > 0"
          :items="buildMenuItems"
          :ui="{ content: 'min-w-48' }"
          :class="block ? 'min-w-0 flex-1' : undefined"
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
        :class="block ? 'min-w-0' : undefined"
        @click="handleShare"
      />
    </u-tooltip>
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
    // * The mobile action bar lays the controls out as two 50% halves.
    block?: boolean;
    // * md is the annex's button step (§13); xs is the 24px stepper step and
    // * was never a button height.
    size?: 'md' | 'lg';
  }>(),
  { labelled: true, block: false, size: 'md' }
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

  // * The menu's own actions are words the UI supplies, so they take the label
  // * role's casing; the build names above them are the user's text and keep
  // * theirs (annex §2). The menu theme cannot tell the two apart — only this
  // * call site can — so the class lands per item rather than on the slot.
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
