<template>
  <BuildNameDialog
    v-model:open="accountSaveOpen"
    v-model:name="accountSaveName"
    title="Save to your account"
    confirm-label="Save"
    placeholder="My build"
    :error="nameError"
    :disabled="nameForm.$invalid"
    :loading="isCreating"
    @confirm="handleSave"
  />

  <u-modal
    v-model:open="accountDeleteOpen"
    title="Delete from your account"
    description="Removes this build from your account and stops its share link."
  >
    <template #body>
      <p class="text-sm text-muted">
        Delete
        <span class="font-semibold text-highlighted">{{
          activeBuildLabel
        }}</span>
        from your account? Its share link will stop working.
      </p>
    </template>

    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <u-button variant="ghost" color="neutral" @click="handleCancelDelete">
          Cancel
        </u-button>

        <u-button color="error" :loading="isDeleting" @click="handleDelete">
          Delete
        </u-button>
      </div>
    </template>
  </u-modal>
</template>

<script setup lang="ts">
import BuildNameDialog from '@/components/build/BuildNameDialog.vue';

import {
  useCreateBuild,
  useDeleteBuild,
  useFetchBuilds
} from '@/services/queries/useBuildQueries';

const toast = useToast();

const authStore = useAuthStore();
const { activeAccountBuildId } = storeToRefs(authStore);
const { setActiveAccountBuildId } = authStore;

const { data: accountBuilds } = useFetchBuilds();

const {
  mutate: createBuild,
  isLoading: isCreating,
  error: createError
} = useCreateBuild({
  errorHandling: { suppressToasts: 'validation' },
  onSuccess: (created, { data }) => {
    setActiveAccountBuildId(created.id);
    updateSavedSnapshot(data);
    accountSaveOpen.value = false;
    accountSaveName.value = '';
    toast.add({ title: `Saved as "${created.name}"`, color: 'success' });
  }
});

const { mutate: deleteBuild, isLoading: isDeleting } = useDeleteBuild({
  onSuccess: () => {
    accountDeleteOpen.value = false;
    toast.add({ title: 'Build deleted', color: 'success' });
  }
});

const { accountSaveOpen, accountSaveName, accountDeleteOpen } = useDialogs();

const plannerState = usePlannerState();

const { updateSavedSnapshot } = useUnsavedChanges();

const externalErrors = useExternalErrors(useValidationErrors(createError));

const { r$: nameForm } = useBuildNameForm(accountSaveName, { externalErrors });

const nameError = computed(() => nameForm.$errors.name?.[0]);

const activeBuildLabel = computed(
  () =>
    accountBuilds.value?.items.find(
      (cloudBuild) => cloudBuild.id === activeAccountBuildId.value
    )?.name ?? 'this build'
);

function handleCancelDelete() {
  accountDeleteOpen.value = false;
}

async function handleSave() {
  const { valid } = await nameForm.$validate();

  if (!valid) {
    return;
  }

  createBuild({
    name: accountSaveName.value.trim(),
    data: serializeBuild(plannerState)
  });
}

function handleDelete() {
  if (activeAccountBuildId.value) {
    deleteBuild(activeAccountBuildId.value);
  }
}
</script>
