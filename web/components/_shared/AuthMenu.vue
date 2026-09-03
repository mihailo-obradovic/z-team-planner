<template>
  <u-dropdown-menu
    v-if="isSignedIn"
    :items="menuItems"
    :ui="{ content: 'min-w-48' }"
  >
    <button
      v-if="tier === 'bare'"
      type="button"
      class="size-11 touch-manipulation items-center justify-center text-neutral-100"
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

  <!-- ! Two different absences, and only one of them reserves space. While the identity is
       ! still `unknown` the control renders at its real geometry and is merely `invisible`,
       ! so the header does not reflow when the SDK reports (feature 004). When there is no
       ! backend to sign in to at all it renders nothing: an unreachable control is not worth
       ! a gap in the row, and that gap is what stage 1 shipped. -->
  <template v-if="!isSignInUnavailable">
    <button
      v-if="tier === 'bare'"
      type="button"
      class="size-11 touch-manipulation items-center justify-center text-neutral-100"
      :class="[visibilityClass, { invisible: !isResolved }]"
      :aria-hidden="isResolved ? undefined : 'true'"
      :tabindex="isResolved ? undefined : -1"
      aria-label="Sign in"
      @click="handleSignIn"
    >
      <u-icon name="i-lucide-log-in" class="size-5" />
    </button>

    <u-tooltip v-else text="Sign in" :disabled="tier === 'labelled'">
      <u-button
        size="md"
        variant="subtle"
        color="neutral"
        icon="i-lucide-log-in"
        :class="[visibilityClass, { invisible: !isResolved }]"
        :aria-hidden="isResolved ? undefined : 'true'"
        :tabindex="isResolved ? undefined : -1"
        :label="tier === 'labelled' ? 'Sign in' : undefined"
        :aria-label="tier === 'labelled' ? undefined : 'Sign in'"
        @click="handleSignIn"
      />
    </u-tooltip>
  </template>
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
