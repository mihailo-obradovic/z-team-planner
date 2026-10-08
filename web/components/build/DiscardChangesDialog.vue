<template>
  <u-modal
    :open="discardOpen"
    :title="title"
    description="Your unsaved changes will be lost."
    :content="dialogContent"
    @update:open="handleOpenChange"
  >
    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <u-button variant="ghost" color="neutral" @click="closeDiscard">
          Cancel
        </u-button>

        <u-button color="error" @click="confirmDiscard">Discard</u-button>
      </div>
    </template>
  </u-modal>
</template>

<script setup lang="ts">
const openBuildName = useOpenBuildName();

const { isViewingSharedBuild } = useBuildMode();

// * In shared-build mode the edits are to the snapshot on screen, not to the build open before it.
const title = computed(() =>
  isViewingSharedBuild.value
    ? 'Discard changes to this shared build?'
    : `Discard changes to "${openBuildName.value}"?`
);

const { discardOpen, confirmDiscard, closeDiscard } = useDiscardGuard();
const { dialogContent } = useDialogs();

function handleOpenChange(open: boolean) {
  if (!open) {
    closeDiscard();
  }
}
</script>
