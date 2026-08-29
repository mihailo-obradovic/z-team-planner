<template>
  <u-modal v-model:open="accountSaveOpen" title="Save to your account">
    <template #body>
      <u-form-field label="Build name" :error="nameError">
        <u-input
          v-model="accountSaveName"
          placeholder="My build"
          autofocus
          @keydown.enter="handleSave"
        />
      </u-form-field>
    </template>

    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <u-button variant="ghost" color="neutral" @click="handleCancelSave">
          Cancel
        </u-button>

        <u-button
          :disabled="nameForm.$invalid"
          :loading="isCreating"
          @click="handleSave"
        >
          Save
        </u-button>
      </div>
    </template>
  </u-modal>

  <u-modal v-model:open="accountDeleteOpen" title="Delete from your account">
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
import {
  useCreateBuild,
  useDeleteBuild,
  useFetchBuilds
} from '@/services/queries/useBuildQueries';

const toast = useToast();

const { accountSaveOpen, accountSaveName, accountDeleteOpen } =
  useBuildDialogs();

const plannerState = usePlannerState();

const { activeAccountBuildId } = storeToRefs(useAuthStore());
const { setActiveAccountBuildId } = useAuthStore();

const { data: accountBuilds } = useFetchBuilds();

const {
  mutate: createBuild,
  isLoading: isCreating,
  error: createError
} = useCreateBuild({
  errorHandling: { suppressToasts: 'validation' },
  onSuccess: (created) => {
    setActiveAccountBuildId(created.id);
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

const externalErrors = useExternalErrors(useValidationErrors(createError));

const { r$: nameForm } = useBuildNameForm(accountSaveName, { externalErrors });

const nameError = computed(() => nameForm.$errors.name?.[0]);

const activeBuildLabel = computed(
  () =>
    accountBuilds.value?.items.find(
      (build) => build.id === activeAccountBuildId.value
    )?.name ?? 'this build'
);

function handleCancelSave() {
  accountSaveOpen.value = false;
}

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
