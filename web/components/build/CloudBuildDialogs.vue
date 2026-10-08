<template>
  <BuildNameDialog
    v-model:open="accountSaveOpen"
    v-model:name="accountSaveName"
    title="Save to your account"
    confirm-label="Save"
    :placeholder="DEFAULT_BUILD_NAME"
    :error="nameError"
    :disabled="nameForm.$invalid"
    :loading="isCreating"
    @confirm="handleSave"
  />
</template>

<script setup lang="ts">
import BuildNameDialog from '@/components/build/BuildNameDialog.vue';

import { useCreateBuild } from '@/services/queries/useBuildQueries';

const toast = useToast();

const { openCloud } = useOpenBuild();

const {
  mutate: createBuild,
  isLoading: isCreating,
  error: createError
} = useCreateBuild({
  errorHandling: { suppressToasts: 'validation' },
  onSuccess: (created, { data }) => {
    openCloud(created.id);
    updateSavedSnapshot(data);
    accountSaveOpen.value = false;
    accountSaveName.value = '';
    toast.add({ title: `Created "${created.name}"`, color: 'success' });
  }
});

const { accountSaveOpen, accountSaveName } = useDialogs();

const plannerState = usePlannerState();

const { updateSavedSnapshot } = useUnsavedChanges();

const externalErrors = useExternalErrors(useValidationErrors(createError));

const { r$: nameForm } = useBuildNameForm(accountSaveName, {
  externalErrors,
  requireName: false
});

const nameError = computed(() => nameForm.$errors.name?.[0]);

async function handleSave() {
  const { valid } = await nameForm.$validate();

  if (!valid) {
    return;
  }

  createBuild({
    name: accountSaveName.value.trim() || DEFAULT_BUILD_NAME,
    data: serializeBuild(plannerState)
  });
}
</script>
