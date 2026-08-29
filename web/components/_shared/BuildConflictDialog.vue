<template>
  <u-modal v-model:open="conflictOpen" title="This build changed elsewhere">
    <template #body>
      <div class="flex flex-col gap-3">
        <p class="text-sm text-muted">
          Another device saved
          <span class="font-semibold text-highlighted">{{
            conflictBuild?.name
          }}</span>
          after you opened it. Saving now would overwrite that version.
        </p>

        <p class="text-sm text-dimmed">
          Last saved elsewhere {{ savedElsewhereAt }}
        </p>
      </div>
    </template>

    <template #footer>
      <div class="flex w-full flex-col gap-2 sm:flex-row sm:justify-end">
        <u-button color="neutral" variant="subtle" @click="handleReloadTheirs">
          Reload theirs
        </u-button>

        <u-button color="primary" @click="handleSaveMineAsNew">
          Save mine as new
        </u-button>
      </div>
    </template>
  </u-modal>
</template>

<script setup lang="ts">
import { useCreateBuild } from '@/services/queries/useBuildQueries';

const toast = useToast();

const { conflictOpen, conflictBuild } = useBuildDialogs();

const { loadAccountBuild } = useBuildMode();
const plannerState = usePlannerState();

const { setActiveAccountBuildId } = useAuthStore();

// * Formatted, not the raw ISO string. Safe from a hydration mismatch because this dialog only ever renders after a failed save, which is client-side by definition.
const savedElsewhereAt = computed(() =>
  formatTimestamp(conflictBuild.value?.updated_at)
);

const { mutate: createBuild } = useCreateBuild({
  onSuccess: (created) => {
    setActiveAccountBuildId(created.id);
    toast.add({ title: `Saved as "${created.name}"`, color: 'success' });
  }
});

// * Take the other device's version.
// * The planner is replaced by their document, which also refreshes the cached build the next save reads its `ETag` from — so the following save is no longer stale.
async function handleReloadTheirs() {
  if (!conflictBuild.value) {
    return;
  }

  await loadAccountBuild(conflictBuild.value.data);
  setActiveAccountBuildId(conflictBuild.value.id);
  conflictOpen.value = false;
}

// * Keep the local edits as a separate build.
// * A create rather than a patch, so neither version is lost — the server suffixes the name if it collides, and the returned name is what the toast reports.
function handleSaveMineAsNew() {
  if (!conflictBuild.value) {
    return;
  }

  createBuild({
    name: conflictBuild.value.name,
    data: serializeBuild(plannerState)
  });

  conflictOpen.value = false;
}
</script>
