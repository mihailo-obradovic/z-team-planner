<template>
  <u-dropdown-menu
    v-if="isSignedIn"
    :items="menuItems"
    :ui="{ content: 'min-w-48' }"
  >
    <button
      v-if="tier === 'bare'"
      type="button"
      class="size-11 items-center justify-center text-neutral-100"
      :class="visibilityClass"
      :aria-label="accountName"
    >
      <u-icon name="i-lucide-user-round" class="size-5" />
    </button>

    <u-button
      v-else
      size="md"
      variant="subtle"
      color="neutral"
      icon="i-lucide-user-round"
      class="max-w-40"
      :class="visibilityClass"
      :ui="{ label: 'truncate' }"
      :label="tier === 'labelled' ? accountName : undefined"
      :aria-label="tier === 'labelled' ? undefined : accountName"
    />
  </u-dropdown-menu>

  <button
    v-else-if="tier === 'bare'"
    type="button"
    class="size-11 items-center justify-center text-neutral-100"
    :class="[visibilityClass, { invisible: !isResolved }]"
    :disabled="isSignInUnavailable"
    :aria-hidden="isResolved ? undefined : 'true'"
    :tabindex="isResolved ? undefined : -1"
    :aria-label="signInLabel"
    @click="handleSignIn"
  >
    <u-icon name="i-lucide-log-in" class="size-5" />
  </button>

  <u-tooltip v-else :text="signInLabel" :disabled="isTooltipRedundant">
    <u-button
      size="md"
      variant="subtle"
      color="neutral"
      icon="i-lucide-log-in"
      :class="[visibilityClass, { invisible: !isResolved }]"
      :disabled="isSignInUnavailable"
      :aria-hidden="isResolved ? undefined : 'true'"
      :tabindex="isResolved ? undefined : -1"
      :label="tier === 'labelled' ? 'Sign in' : undefined"
      :aria-label="tier === 'labelled' ? undefined : signInLabel"
      @click="handleSignIn"
    />
  </u-tooltip>
</template>

<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui';

import type { HeaderTier } from '@/types/ui';

const props = withDefaults(defineProps<{ tier?: HeaderTier }>(), {
  tier: 'labelled'
});

const { isSignedIn, isResolved, isSignInUnavailable, user } =
  storeToRefs(useAuthStore());

const { signIn, signOut } = useAuth();

const { openBuildMenu } = useBuildDialogs();

const { deleteAccountOpen } = useAccountDialogs();

const accountName = computed(() => {
  const { displayName, email } = user.value ?? {};

  return displayName || email?.split('@', 1)[0] || 'Account';
});

const visibilityClass = computed(
  () =>
    ({
      labelled: 'hidden lg:inline-flex',
      icon: 'hidden md:inline-flex lg:hidden',
      bare: 'flex md:hidden'
    })[props.tier]
);

const signInLabel = computed(() =>
  isSignInUnavailable.value ? 'Sign-in is unavailable' : 'Sign in'
);

const isTooltipRedundant = computed(
  () => props.tier === 'labelled' && !isSignInUnavailable.value
);

const menuItems = computed<DropdownMenuItem[][]>(() => [
  [
    {
      label: 'My builds',
      icon: 'i-lucide-cloud',
      class: 'uppercase',
      onSelect: () => openBuildMenu(props.tier)
    }
  ],
  [
    {
      label: 'Sign out',
      icon: 'i-lucide-log-out',
      class: 'uppercase',
      onSelect: () => {
        void signOut();
      }
    },
    {
      label: 'Delete account...',
      icon: 'i-lucide-trash-2',
      color: 'error',
      class: 'uppercase',
      onSelect: () => {
        deleteAccountOpen.value = true;
      }
    }
  ]
]);

function handleSignIn() {
  void signIn();
}
</script>
