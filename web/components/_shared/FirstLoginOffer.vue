<template>
  <u-modal v-model:open="isOpen" title="Keep your builds?">
    <template #body>
      <div class="flex flex-col gap-4">
        <p class="text-sm text-muted">
          {{ intro }}
        </p>

        <div class="flex flex-col gap-2">
          <!-- ! size xl, not the default md: it is the only step whose container clears the
               ! 24px touch floor (annex §14.2). The box itself paints at 20 and the label is
               ! part of the target, so the row is what a finger lands on. -->
          <u-checkbox
            v-for="build in candidates"
            :key="build.id"
            size="xl"
            :model-value="selected.includes(build.id)"
            :label="build.name"
            @update:model-value="handleToggle(build.id, $event === true)"
          />
        </div>

        <p v-if="isCapped" class="text-sm text-muted">
          Only the first 50 can be kept at once.
        </p>
      </div>
    </template>

    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <u-button variant="ghost" color="neutral" @click="handleDismiss">
          Not now
        </u-button>

        <u-button
          :disabled="selected.length === 0"
          :loading="isImporting"
          @click="handleKeep"
        >
          Keep selected
        </u-button>
      </div>
    </template>
  </u-modal>
</template>

<script setup lang="ts">
import { useImportBuilds } from '@/services/queries/useBuildQueries';

import type { ImportReport } from '@/types/api';
import type { SavedBuild } from '@/types/build';

// * Feature 005 takes at most 50 items in one import.
const IMPORT_LIMIT = 50;

// * Alongside `z-team-builds` and `z-team-active-build` (feature 001).
const OFFER_SEEN_KEY = 'z-team-import-offer-seen';

const toast = useToast();

const { isSignedIn } = storeToRefs(useAuthStore());

const { savedBuilds } = useHeroPlanner();

const isOpen = ref(false);
const selected = ref<string[]>([]);

const candidates = computed<SavedBuild[]>(() =>
  savedBuilds.value.slice(0, IMPORT_LIMIT)
);

const isCapped = computed(() => savedBuilds.value.length > IMPORT_LIMIT);

const intro = computed(
  () =>
    `You have ${plural(savedBuilds.value.length, 'build')} saved in this browser. ` +
    'Keep them in your account and they follow you to other devices — the copies here stay either way.'
);

const { mutate: importBuilds, isLoading: isImporting } = useImportBuilds({
  onSuccess: (report) => {
    reportOutcome(report);
    close();
  }
});

function plural(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? '' : 's'}`;
}

function hasSeenOffer(): boolean {
  try {
    return localStorage.getItem(OFFER_SEEN_KEY) !== null;
  } catch {
    // * No storage means no local builds either — there would be nothing to offer.
    return true;
  }
}

function markOfferSeen() {
  try {
    localStorage.setItem(OFFER_SEEN_KEY, '1');
  } catch {
    // * Nothing to do: without storage the offer cannot be suppressed, and without storage
    // * there are no local builds to raise it again.
  }
}

function close() {
  isOpen.value = false;
}

/** One toast for the whole batch — feature 008 owns the import's per-item reporting. */
function reportOutcome(report: ImportReport) {
  const created = report.filter((item) => item.status === 'created');
  const invalid = report.filter((item) => item.status === 'invalid');

  const names = invalid
    .map((item) => item.name ?? candidates.value[item.index]?.name)
    .filter(Boolean);

  toast.add({
    title:
      created.length > 0
        ? `${plural(created.length, 'build')} kept`
        : 'Nothing was kept',
    // * Names the ones that failed rather than a count: the player has to know which build
    // * to look at, and import succeeds per item (feature 005).
    description:
      names.length > 0 ? `Could not import: ${names.join(', ')}` : undefined,
    color: invalid.length > 0 ? 'warning' : 'success'
  });
}

function handleToggle(id: string, checked: boolean) {
  selected.value = checked
    ? [...selected.value, id]
    : selected.value.filter((selectedId) => selectedId !== id);
}

function handleKeep() {
  markOfferSeen();

  importBuilds({
    builds: candidates.value
      .filter((build) => selected.value.includes(build.id))
      .map((build) => ({ name: build.name, data: build.data }))
  });
}

function handleDismiss() {
  markOfferSeen();
  close();
}

// * The offer is a one-time thing per browser, so it hangs off the transition into
// * `signed-in` rather than off the signed-in state itself (feature 004).
watch(isSignedIn, (signedIn, wasSignedIn) => {
  if (!signedIn || wasSignedIn) {
    return;
  }

  if (savedBuilds.value.length === 0 || hasSeenOffer()) {
    return;
  }

  // * All of them, so keeping everything is one click and dropping one is the deliberate act.
  selected.value = candidates.value.map((build) => build.id);
  isOpen.value = true;
});

// ! Written when the dialog closes by any route — the scrim, Escape, the close button — and
// ! not only from the two footer buttons. "Shown once per browser" has to survive a dismissal
// ! the component did not initiate.
watch(isOpen, (open) => {
  if (!open) {
    markOfferSeen();
  }
});
</script>
