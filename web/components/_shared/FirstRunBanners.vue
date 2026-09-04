<template>
  <div v-if="pending.length > 0" class="shrink-0">
    <div
      v-for="notice in pending"
      :key="notice.key"
      class="flex flex-col gap-2 border-t-2 border-secondary-950 bg-secondary-800 p-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
      role="region"
      :aria-label="notice.label"
    >
      <!-- ! Cream, not the muted body colour: on the teal chrome only cream and steel clear the body floor (annex §14.1 — cream is 9.03:1). -->
      <p class="text-sm text-neutral-100">
        <span class="font-semibold">{{ notice.lead }}</span>
        {{ notice.body }}

        <NuxtLink
          v-if="notice.link"
          class="text-link hover:text-secondary-300"
          :to="notice.link.to"
        >
          {{ notice.link.label }}
        </NuxtLink>
      </p>

      <!-- * Neutral subtle, like Story Setup and Save: a secondary solid on this bar is 1.29:1 and is never a control (annex §14.1). -->
      <u-button
        class="w-full shrink-0 justify-center sm:w-auto"
        size="md"
        variant="subtle"
        color="neutral"
        :label="notice.confirm"
        @click="handleConfirm(notice.key)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
type Notice = {
  key: string;
  label: string;
  lead: string;
  body: string;
  confirm: string;
  link?: { to: string; label: string };
};

// * Array order is stacking order: the spoiler warning sits above the storage notice (feature 017).
const NOTICES: Notice[] = [
  {
    key: 'z-team-spoiler-acknowledged',
    label: 'Spoiler warning',
    lead: 'Spoilers ahead.',
    body: 'This planner shows the full roster and every power at once — including heroes who leave or join the team later in the story, and upgrades you may not have unlocked yet.',
    confirm: 'I understand'
  },
  {
    key: 'z-team-storage-notice-acknowledged',
    label: 'Browser storage notice',
    lead: 'Your builds stay in this browser.',
    body: "Saved builds live in this browser's storage, not on a server. Sign in and they're saved to your account instead.",
    confirm: 'Got it',
    // * The notice is the moment the storage is first mentioned, so the policy is one step away from it (feature 010).
    link: { to: '/privacy', label: 'Privacy' }
  }
];

// * Mounted client-only, so setup already knows what storage holds and the first paint is the right one.
const pending = ref<Notice[]>(
  NOTICES.filter((notice) => !isAcknowledged(notice.key))
);

function isAcknowledged(key: string): boolean {
  try {
    return localStorage.getItem(key) !== null;
  } catch {
    // ! Fails visible, unlike FirstLoginOffer: a warning that cannot read its flag is shown rather than skipped.
    return false;
  }
}

function handleConfirm(key: string) {
  try {
    localStorage.setItem(key, '1');
  } catch {
    // * A full or blocked quota loses the write, not the session — the notice returns on the next load.
  }

  pending.value = pending.value.filter((notice) => notice.key !== key);
}
</script>
