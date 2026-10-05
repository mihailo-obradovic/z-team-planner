<template>
  <u-modal
    v-model:open="isOpen"
    title="Keep your builds?"
    description="Copy the builds in this browser into your account."
  >
    <template #body>
      <div class="flex flex-col gap-4">
        <p class="text-sm text-muted">
          {{ intro }}
        </p>

        <div class="flex flex-col gap-2">
          <!-- ! Size xl: the only size whose target clears the 24px touch floor. -->
          <u-checkbox
            v-for="localBuild in candidates"
            :key="localBuild.id"
            :model-value="selected.includes(localBuild.id)"
            :label="localBuild.name"
            @update:model-value="(value) => handleToggle(localBuild.id, value)"
          />
        </div>

        <p v-if="isCapped" class="text-sm text-muted">
          Only the first 50 can be kept at once.
        </p>
      </div>
    </template>

    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <u-button variant="ghost" color="neutral" @click="close">
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
import {
  useAlreadyKept,
  useImportBuilds
} from '@/services/queries/useBuildQueries';

import type { ImportReport } from '@/types/api';
import type { LocalBuild } from '@/types/build';

const IMPORT_LIMIT = 50;

const OFFER_SEEN_KEY = 'z-team-import-offer-seen';

const toast = useToast();

const { isSignedIn } = storeToRefs(useAuthStore());

const { mutate: importBuilds, isLoading: isImporting } = useImportBuilds({
  onSuccess: (report) => {
    reportOutcome(report);
    close();
  }
});

const { localBuilds } = useLocalBuilds();

const isOpen = ref(false);
const isOfferPending = ref(false);
const selected = ref<string[]>([]);

const { alreadyKeptIds, status: alreadyKeptStatus } = useAlreadyKept(
  localBuilds,
  () => isOfferPending.value
);

// * A build the account already holds would only come back as "existing", so it is never offered.
const offerable = computed<LocalBuild[]>(() =>
  localBuilds.value.filter(
    (localBuild) => !alreadyKeptIds.value.has(localBuild.id)
  )
);

const candidates = computed<LocalBuild[]>(() =>
  offerable.value.slice(0, IMPORT_LIMIT)
);

const isCapped = computed(() => offerable.value.length > IMPORT_LIMIT);

const intro = computed(
  () =>
    `You have ${plural(offerable.value.length, 'build')} saved in this browser. ` +
    'Keep them in your account and they follow you to other devices — the copies here stay either way.'
);

function plural(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? '' : 's'}`;
}

function hasSeenOffer(): boolean {
  try {
    return localStorage.getItem(OFFER_SEEN_KEY) !== null;
  } catch {
    return true;
  }
}

function markOfferSeen() {
  try {
    localStorage.setItem(OFFER_SEEN_KEY, '1');
  } catch {
    // * Without storage the offer can't be suppressed, but there are no local builds to raise it either.
  }
}

function close() {
  isOpen.value = false;
}

function reportOutcome(report: ImportReport) {
  const created = report.filter((item) => item.status === 'created');
  const existing = report.filter((item) => item.status === 'existing');
  const invalid = report.filter((item) => item.status === 'invalid');

  const names = invalid
    .map((item) => item.name ?? candidates.value[item.index]?.name)
    .filter(Boolean);

  const lines = [
    created.length > 0 && existing.length > 0
      ? `${existing.length} ${existing.length === 1 ? 'was' : 'were'} already in your account`
      : '',
    names.length > 0 ? `Could not import: ${names.join(', ')}` : ''
  ].filter(Boolean);

  toast.add({
    title: outcomeTitle(created.length, existing.length),
    description: lines.length > 0 ? lines.join('. ') : undefined,
    color: invalid.length > 0 ? 'warning' : 'success'
  });
}

function outcomeTitle(createdCount: number, existingCount: number): string {
  if (createdCount > 0) {
    return `${plural(createdCount, 'build')} kept`;
  }

  return existingCount > 0 ? 'Already in your account' : 'Nothing was kept';
}

function handleToggle(id: string, value: boolean | 'indeterminate') {
  selected.value =
    value === true
      ? [...selected.value, id]
      : selected.value.filter((selectedId) => selectedId !== id);
}

function handleKeep() {
  importBuilds({
    builds: candidates.value
      .filter((localBuild) => selected.value.includes(localBuild.id))
      .map((localBuild) => ({ name: localBuild.name, data: localBuild.data }))
  });
}

watch(isSignedIn, (signedIn, wasSignedIn) => {
  if (!signedIn) {
    isOfferPending.value = false;

    return;
  }

  if (wasSignedIn || localBuilds.value.length === 0 || hasSeenOffer()) {
    return;
  }

  isOfferPending.value = true;
});

// * The offer waits for the account's answer. Nothing to offer, or no answer, leaves it unanswered rather than spent, so the next sign-in asks again.
watch([isOfferPending, alreadyKeptStatus], ([pending, status]) => {
  if (!pending || status === 'pending') {
    return;
  }

  isOfferPending.value = false;

  if (status === 'failed' || candidates.value.length === 0) {
    return;
  }

  selected.value = candidates.value.map((localBuild) => localBuild.id);
  isOpen.value = true;
});

watch(isOpen, (open) => {
  if (!open) {
    markOfferSeen();
  }
});
</script>
