<template>
  <BuildNameDialog
    v-model:open="saveAsNewOpen"
    v-model:name="saveAsNewName"
    title="Save as new build"
    confirm-label="Save"
    :placeholder="DEFAULT_BUILD_NAME"
    :error="nameError"
    :disabled="isNameInvalid"
    @confirm="confirmSaveAsNew"
  />
</template>

<script setup lang="ts">
import BuildNameDialog from '@/components/build/BuildNameDialog.vue';

const toast = useToast();

const { saveAsNewLocalBuild } = useLocalBuilds();

const { saveAsNewOpen, saveAsNewName } = useDialogs();

const { r$: nameForm } = useBuildNameForm(saveAsNewName, {
  requireName: false
});

const nameError = computed(() => nameForm.$errors.name?.[0]);

const isNameInvalid = computed(() => nameForm.$invalid);

function confirmSaveAsNew() {
  if (nameForm.$invalid) {
    return;
  }

  const name = saveAsNewLocalBuild(saveAsNewName.value);

  saveAsNewOpen.value = false;
  saveAsNewName.value = '';
  toast.add({ title: `Created "${name}"`, color: 'success' });
}
</script>
