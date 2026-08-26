<template>
  <u-dropdown-menu
    v-if="isSignedIn"
    :items="menuItems"
    :ui="{ content: 'min-w-48' }"
  >
    <!-- ! Cream, not text-inverted: --ui-text-inverted resolves to ink, which is unreadable on the teal chrome this glyph sits on (annex §1, §14.1 — cream on chrome is 9.03:1). -->
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

// * Google's own display name, and never editable here (feature 004, Non-goals). The email is
// * the fallback the server applies too, so the header and `/me` agree on what to call someone.
const accountName = computed(
  () => user.value?.displayName || user.value?.email || 'Account'
);

// * The tier ladder, applied the way the header already applies it: one control per tier,
// * each showing at its own breakpoint (annex §13). A component cannot ask how wide the
// * viewport is without breaking the prerender, and CSS answers it without asking.
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

// * The labelled tier already says "Sign in" on the button; a tooltip repeating it is noise.
// * When sign-in is unavailable the tooltip is the only place that says why, so it stays.
const isTooltipRedundant = computed(
  () => props.tier === 'labelled' && !isSignInUnavailable.value
);

const menuItems = computed<DropdownMenuItem[][]>(() => [
  [
    {
      label: 'My builds',
      icon: 'i-lucide-cloud',
      class: 'uppercase',
      // * Opens the build selector at this same tier — the one copy that is on screen.
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
    }
  ]
]);

function handleSignIn() {
  void signIn();
}
</script>
