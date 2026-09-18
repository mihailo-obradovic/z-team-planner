<template>
  <u-dropdown-menu
    v-if="localBuilds.length > 0 || isSignedIn"
    v-model:open="isMenuOpen"
    :items="buildMenuItems"
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

<script setup lang="ts">
import {
  useFetchBuild,
  useFetchBuilds
} from '@/services/queries/useBuildQueries';

import type { DropdownMenuItem } from '@nuxt/ui';
import type { HeaderTier } from '@/types/header';

const props = defineProps<{
  tier: HeaderTier;
  size: 'md' | 'lg';
  block: boolean;
}>();

const authStore = useAuthStore();
const { isSignedIn, activeAccountBuildId } = storeToRefs(authStore);
const { setActiveAccountBuildId } = authStore;

const { data: accountBuilds, isPending: accountBuildsPending } =
  useFetchBuilds();

const { data: openedAccountBuild } = useFetchBuild(activeAccountBuildId);

const { localBuilds, activeBuildId, activeBuildName, loadLocalBuild } =
  useLocalBuilds();

const { loadAccountBuild } = useBuildMode();
const { updateSavedSnapshot } = useUnsavedChanges();

const {
  buildMenuTier,
  deleteOpen,
  accountDeleteOpen,
  openNewBuild,
  openRename,
  openAccountSave
} = useDialogs();

// * One open state shared by every tier's instance, so only the visible one is live.
const isMenuOpen = computed({
  get: () => buildMenuTier.value === props.tier,
  set: (open: boolean) => {
    buildMenuTier.value = open ? props.tier : null;
  }
});

const activeAccountBuild = computed(() =>
  accountBuilds.value?.items.find(
    (cloudBuild) => cloudBuild.id === activeAccountBuildId.value
  )
);

const displayName = computed(
  () => activeAccountBuild.value?.name ?? activeBuildName.value
);

const buildMenuItems = computed<DropdownMenuItem[][]>(() => {
  const localBuildItems = localBuilds.value.map((localBuild) => ({
    label: localBuild.name,
    icon: localBuild.id === activeBuildId.value ? 'i-lucide-check' : undefined,
    onSelect: () => {
      loadLocalBuild(localBuild.id);
    }
  }));

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

    return [localBuildItems, management, hint];
  }

  const account: DropdownMenuItem[] = accountBuildsPending.value
    ? [
        {
          label: 'Loading your builds...',
          icon: 'i-lucide-loader',
          disabled: true
        }
      ]
    : (accountBuilds.value?.items ?? []).map((cloudBuild) => ({
        label: cloudBuild.name,
        icon:
          cloudBuild.id === activeAccountBuildId.value
            ? 'i-lucide-check'
            : 'i-lucide-cloud',
        onSelect: () => {
          void openAccountBuild(cloudBuild.id);
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

  return [localBuildItems, account, accountActions, management];
});

// * Picking a new id lets the watcher below load it once fetched; picking the open one reloads it in place.
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

watch(openedAccountBuild, async (cloudBuild) => {
  if (cloudBuild) {
    await loadAccountBuild(cloudBuild.data);
    updateSavedSnapshot();
  }
});
</script>
