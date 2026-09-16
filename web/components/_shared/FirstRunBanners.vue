<template>
  <div ref="region" class="shrink-0">
    <TransitionGroup name="first-run-banner" appear @beforeLeave="sealLeaving">
      <div
        v-for="notice in pending"
        :key="notice.key"
        :data-notice="notice.key"
        class="first-run-banner grid"
      >
        <!-- * The clip box: the row's height animates while this hides the body passing through it. -->
        <div class="min-h-0 overflow-hidden">
          <div
            class="first-run-banner-body flex flex-col gap-2 border-t-2 border-secondary-950 bg-secondary-800 p-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
            role="region"
            :aria-label="notice.label"
          >
            <!-- ! Cream, not the muted body colour: only cream and steel clear the body contrast floor on teal. -->
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

            <!-- * Neutral subtle: a secondary solid on this bar is 1.29:1. -->
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
      </div>
    </TransitionGroup>
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

// * Array order is stacking order.
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
    // * The storage notice links the policy where storage is first mentioned.
    link: { to: '/privacy', label: 'Privacy' }
  }
];

const region = useTemplateRef<HTMLElement>('region');

// * Client-only, so setup already knows what storage holds and the first paint is right.
const pending = ref<Notice[]>(
  NOTICES.filter((notice) => !isAcknowledged(notice.key))
);

function isAcknowledged(key: string): boolean {
  try {
    return localStorage.getItem(key) !== null;
  } catch {
    // ! Fails visible, unlike FirstLoginOffer: a warning that can't read its flag is shown.
    return false;
  }
}

async function handleConfirm(key: string) {
  // ! The button outlives the exit animation, so a second press would rewrite the key and move focus again.
  if (!pending.value.some((notice) => notice.key === key)) {
    return;
  }

  try {
    localStorage.setItem(key, '1');
  } catch {
    // * A full quota loses the write; the notice returns on the next load.
  }

  pending.value = pending.value.filter((notice) => notice.key !== key);

  await nextTick();
  focusFirstPending();
}

// * Focus moves to the banner still up rather than stay on one mid-exit.
function focusFirstPending() {
  const next = pending.value[0];

  if (!next) {
    return;
  }

  region.value
    ?.querySelector<HTMLElement>(`[data-notice="${next.key}"] button`)
    ?.focus();
}

// * Keeps a dismissed notice out of the tab order and away from assistive technology during its exit.
function sealLeaving(element: Element) {
  element.setAttribute('inert', '');
  element.setAttribute('aria-hidden', 'true');
}
</script>
