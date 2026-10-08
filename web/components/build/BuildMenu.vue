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

const { isSignedIn } = storeToRefs(useAuthStore());

const { openCloudId, openCloud } = useOpenBuild();

const { data: accountBuilds, isPending: accountBuildsPending } =
  useFetchBuilds();

const { data: openedAccountBuild } = useFetchBuild(openCloudId);

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
  openAccountSave,
  rememberOpener
} = useDialogs();

const isMenuOpen = computed({
  get: () => buildMenuTier.value === props.tier,
  set: (open: boolean) => {
    buildMenuTier.value = open ? props.tier : null;
  }
});

const activeAccountBuild = computed(() =>
  accountBuilds.value?.items.find(
    (cloudBuild) => cloudBuild.id === openCloudId.value
  )
);

const displayName = computed(
  () => activeAccountBuild.value?.name ?? activeBuildName.value
);

const buildMenuItems = computed<DropdownMenuItem[][]>(() => {
  // * Checkbox items, so the loaded build is `aria-checked` rather than marked by an icon only; the library draws the check as the trailing indicator.
  const localBuildItems: DropdownMenuItem[] = localBuilds.value.map(
    (localBuild) => ({
      label: localBuild.name,
      type: 'checkbox',
      checked: localBuild.id === activeBuildId.value,
      onSelect: () => {
        loadLocalBuild(localBuild.id);
      }
    })
  );

  const management: DropdownMenuItem[] = [
    {
      label: 'New build...',
      icon: 'i-lucide-plus',
      class: 'uppercase',
      onSelect: () => {
        rememberOpener();
        openNewBuild('');
      }
    },
    {
      label: 'Rename...',
      icon: 'i-lucide-pencil',
      class: 'uppercase',
      onSelect: () => {
        rememberOpener();
        openRename(activeBuildName.value);
      }
    }
  ];

  if (localBuilds.value.length > 1 && activeBuildId.value) {
    management.push({
      label: 'Delete...',
      icon: 'i-lucide-trash-2',
      color: 'error',
      class: 'uppercase',
      onSelect: () => {
        rememberOpener();
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
        icon: 'i-lucide-cloud',
        type: 'checkbox' as const,
        checked: cloudBuild.id === openCloudId.value,
        onSelect: () => {
          void openAccountBuild(cloudBuild.id);
        }
      }));

  const accountActions: DropdownMenuItem[] = [
    {
      label: 'Save to account...',
      icon: 'i-lucide-cloud-upload',
      class: 'uppercase',
      onSelect: () => {
        rememberOpener();
        openAccountSave(displayName.value);
      }
    }
  ];

  if (openCloudId.value) {
    accountActions.push({
      label: 'Delete from account...',
      icon: 'i-lucide-cloud-off',
      color: 'error',
      class: 'uppercase',
      onSelect: () => {
        rememberOpener();
        accountDeleteOpen.value = true;
      }
    });
  }

  return [localBuildItems, account, accountActions, management];
});

async function openAccountBuild(id: string) {
  if (id !== openCloudId.value) {
    openCloud(id);

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
