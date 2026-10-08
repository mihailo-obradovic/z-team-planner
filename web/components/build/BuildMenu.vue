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
      :icon="locationIcon"
      trailing-icon="i-lucide-chevron-down"
      :block="block"
      :class="block ? undefined : 'w-40'"
      :label="openBuildName"
      :ui="{ label: 'truncate' }"
    />
  </u-dropdown-menu>
</template>

<script setup lang="ts">
import {
  useFetchBuild,
  useFetchBuilds
} from '@/services/queries/useBuildQueries';

import type { DeviceClass } from '@/composables/ui/useDeviceClass';

import type { DropdownMenuItem } from '@nuxt/ui';
import type { HeaderTier } from '@/types/header';

const props = defineProps<{
  tier: HeaderTier;
  size: 'md' | 'lg';
  block: boolean;
}>();

const { isSignedIn, isDestinationKnown } = storeToRefs(useAuthStore());

const { openLocalId, openCloudId, openCloud, requestedCloudId } =
  useOpenBuild();
const openBuildName = useOpenBuildName();
const deviceClass = useDeviceClass();
const { startNewBuild } = useNewBuild();
const { guardDiscard } = useDiscardGuard();

const { data: accountBuilds, isPending: accountBuildsPending } =
  useFetchBuilds();

const { data: openedAccountBuild } = useFetchBuild(openCloudId);

const { localBuilds, loadLocalBuild } = useLocalBuilds();

const { loadAccountBuild } = useBuildMode();
const { updateSavedSnapshot } = useUnsavedChanges();

const {
  buildMenuTier,
  deleteOpen,
  openSaveAsNew,
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

const DEVICE_ICONS: Record<DeviceClass, string> = {
  phone: 'i-lucide-smartphone',
  tablet: 'i-lucide-tablet',
  monitor: 'i-lucide-monitor'
};

// * Where the open build lives, shown only while signed in — signed out, everything is in this browser (feature 029).
const locationIcon = computed(() => {
  if (!isSignedIn.value) {
    return undefined;
  }

  if (openCloudId.value) {
    return 'i-lucide-cloud';
  }

  return openLocalId.value ? DEVICE_ICONS[deviceClass.value] : undefined;
});

const buildMenuItems = computed<DropdownMenuItem[][]>(() => {
  // * Checkbox items, so the open build is `aria-checked` rather than marked by an icon only; the library draws the check as the trailing indicator.
  const localBuildItems: DropdownMenuItem[] = localBuilds.value.map(
    (localBuild) => ({
      label: localBuild.name,
      type: 'checkbox',
      checked: localBuild.id === openLocalId.value,
      onSelect: () => {
        guardDiscard(() => loadLocalBuild(localBuild.id));
      }
    })
  );

  // * Groups with nothing in them are left out, so no separator ever frames an empty box.
  return [
    localBuildItems,
    accountBuildItems(),
    actionItems(),
    signedOutHint()
  ].filter((group) => group.length > 0);
});

function accountBuildItems(): DropdownMenuItem[] {
  if (!isSignedIn.value) {
    return [];
  }

  if (accountBuildsPending.value) {
    return [
      {
        label: 'Loading your builds...',
        icon: 'i-lucide-loader',
        disabled: true
      }
    ];
  }

  return (accountBuilds.value?.items ?? []).map((cloudBuild) => ({
    label: cloudBuild.name,
    icon: 'i-lucide-cloud',
    type: 'checkbox' as const,
    checked: cloudBuild.id === openCloudId.value,
    onSelect: () => {
      guardDiscard(() => openAccountBuild(cloudBuild.id));
    }
  }));
}

function actionItems(): DropdownMenuItem[] {
  // * A cloud build left open by a session that ended cannot be renamed or deleted until its owner signs back in.
  const isOpen =
    !!openLocalId.value || (!!openCloudId.value && isSignedIn.value);

  const actions: DropdownMenuItem[] = [
    {
      label: 'New build',
      icon: 'i-lucide-plus',
      class: 'uppercase',
      disabled: !isDestinationKnown.value,
      onSelect: () => {
        guardDiscard(startNewBuild);
      }
    },
    {
      label: 'Save as new...',
      icon: 'i-lucide-copy-plus',
      class: 'uppercase',
      disabled: !isDestinationKnown.value,
      onSelect: () => {
        rememberOpener();

        if (isSignedIn.value) {
          openAccountSave(openBuildName.value);
        } else {
          openSaveAsNew(openBuildName.value);
        }
      }
    }
  ];

  // * Signed in, a new build goes to the account, so a local one still open here is the exception worth naming.
  if (isSignedIn.value && openLocalId.value) {
    actions.push({
      label: 'This build is only in this browser',
      icon: DEVICE_ICONS[deviceClass.value],
      class: 'whitespace-normal',
      type: 'label'
    });
  }

  if (isOpen) {
    actions.push(
      {
        label: 'Rename...',
        icon: 'i-lucide-pencil',
        class: 'uppercase',
        onSelect: () => {
          rememberOpener();
          openRename(openBuildName.value);
        }
      },
      {
        label: 'Delete...',
        icon: 'i-lucide-trash-2',
        color: 'error',
        class: 'uppercase',
        onSelect: () => {
          rememberOpener();
          deleteOpen.value = true;
        }
      }
    );
  }

  return actions;
}

function signedOutHint(): DropdownMenuItem[] {
  if (isSignedIn.value) {
    return [];
  }

  return [
    {
      label: 'Sign in to keep your builds stored securely',
      icon: 'i-lucide-cloud-off',
      class: 'whitespace-normal',
      type: 'label'
    }
  ];
}

async function openAccountBuild(id: string) {
  if (id !== openCloudId.value) {
    openCloud(id);
    // * `useOpenBuildSync` loads it when it arrives.
    requestedCloudId.value = id;

    return;
  }

  const opened = openedAccountBuild.value;

  if (opened) {
    await loadAccountBuild(opened.data);

    updateSavedSnapshot();
  }
}
</script>
