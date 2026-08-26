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
          v-if="savedBuilds.length > 0 || isSignedIn"
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
            {{ displayName }}
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

import {
  useCreateBuild,
  useFetchBuild,
  useFetchBuilds,
  useUpdateBuild
} from '@/services/queries/useBuildQueries';

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
  serializeCurrentBuild,
  activeBuildId,
  activeBuildName,
  isViewingSharedBuild,
  hasUnsavedChanges,
  saveBuild,
  loadBuild,
  shareBuild,
  backToMyBuild
} = useHeroPlanner();

const {
  saveSharedOpen,
  deleteOpen,
  accountDeleteOpen,
  openNewBuild,
  openRename,
  openAccountSave
} = useBuildDialogs();

const { loadAccountBuild } = useHeroPlanner();

const { isSignedIn, activeAccountBuildId } = storeToRefs(useAuthStore());
const { setActiveAccountBuildId } = useAuthStore();

// * Disabled until signed in, so a signed-out load makes no request (feature 006).
const { data: accountBuilds, isPending: accountBuildsPending } = useFetchBuilds(
  ref(1)
);

// * Reads the build the user picked; the planner is filled from it in the watcher below.
const { data: openedAccountBuild } = useFetchBuild(activeAccountBuildId);

// * An account build's name wins while one is open — the local active build is a different
// * thing and its name would be the wrong label.
const activeAccountBuild = computed(() =>
  accountBuilds.value?.items.find(
    (build) => build.id === activeAccountBuildId.value
  )
);

const displayName = computed(
  () => activeAccountBuild.value?.name ?? activeBuildName.value
);

watch(openedAccountBuild, async (build) => {
  if (build) {
    await loadAccountBuild(build.data);
  }
});

// * The planner's current state, serialised the same way a local save serialises it — the
// * account build stores exactly the format feature 001 owns.
const { mutate: patchBuild, isLoading: isPatching } = useUpdateBuild({
  onSuccess: (updated) => {
    toast.add({ title: `Saved "${updated.name}"`, color: 'success' });
  }
});

const { mutate: postBuild } = useCreateBuild({
  onSuccess: (created) => {
    setActiveAccountBuildId(created.id);
    toast.add({ title: `Saved as "${created.name}"`, color: 'success' });
  }
});

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

  if (!isSignedIn.value) {
    return [builds, management];
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
          // * Selecting only records which build is open; the query watcher loads it, so the
          // * component never fetches (feature 006, Invariants).
          setActiveAccountBuildId(build.id);
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

  // * Account builds are their own group so it is obvious which ones follow you across
  // * devices and which live in this browser.
  return [builds, account, accountActions, management];
});

function openSaveShared() {
  saveSharedOpen.value = true;
}

function handleSave() {
  // * An open account build saves to the account; the ETag comes from the cached build inside
  // * the mutation, so this component never sees one (feature 006).
  if (activeAccountBuildId.value) {
    patchBuild({
      id: activeAccountBuildId.value,
      payload: { data: serializeCurrentBuild() }
    });

    return;
  }

  if (savedBuilds.value.length === 0) {
    openNewBuild('Build 1');
    return;
  }

  saveBuild();
  toast.add({ title: 'Build saved', color: 'success' });
}

async function handleShare() {
  // * An account build shares as a live link: `/b/{id}` always shows the owner's current
  // * document, where `?build=` freezes whatever was on screen when it was copied
  // * (feature 005). A local build has no id on the server, so it keeps the snapshot.
  const success = activeAccountBuildId.value
    ? await copyAccountBuildLink(activeAccountBuildId.value)
    : await shareBuild();

  toast.add(
    success
      ? { title: 'Link copied to clipboard', color: 'success' }
      : { title: 'Failed to copy link', color: 'error' }
  );
}

async function copyAccountBuildLink(id: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(
      new URL(`/b/${id}`, window.location.origin).toString()
    );

    return true;
  } catch {
    // * Same degradation as the snapshot path: an error toast, and nothing else breaks.
    return false;
  }
}
</script>
