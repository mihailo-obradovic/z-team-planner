<template>
  <u-modal v-model:open="isOpen" title="Keep your builds?">
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
            @update:modelValue="(value) => handleToggle(localBuild.id, value)"
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
import { useImportBuilds } from '@/services/queries/useBuildQueries';

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
const selected = ref<string[]>([]);

const candidates = computed<LocalBuild[]>(() =>
  localBuilds.value.slice(0, IMPORT_LIMIT)
);

const isCapped = computed(() => localBuilds.value.length > IMPORT_LIMIT);

const intro = computed(
  () =>
    `You have ${plural(localBuilds.value.length, 'build')} saved in this browser. ` +
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
  const invalid = report.filter((item) => item.status === 'invalid');

  const names = invalid
    .map((item) => item.name ?? candidates.value[item.index]?.name)
    .filter(Boolean);

  toast.add({
    title:
      created.length > 0
        ? `${plural(created.length, 'build')} kept`
        : 'Nothing was kept',
    description:
      names.length > 0 ? `Could not import: ${names.join(', ')}` : undefined,
    color: invalid.length > 0 ? 'warning' : 'success'
  });
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
  if (!signedIn || wasSignedIn) {
    return;
  }

  if (localBuilds.value.length === 0 || hasSeenOffer()) {
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
