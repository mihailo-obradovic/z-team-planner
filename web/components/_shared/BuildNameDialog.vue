<template>
  <u-modal v-model:open="open" :title="title">
    <template #body>
      <u-form-field label="Build name" :error="error">
        <u-input
          v-model="name"
          :placeholder="placeholder"
          autofocus
          @keydown.enter="handleConfirm"
        />

        <!-- ! An empty help line holds the error's place: without it an error mounting mid-typing moved the confirm button 14px. -->
        <template #help>
          <span aria-hidden="true">&nbsp;</span>
        </template>
      </u-form-field>
    </template>

    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <u-button variant="ghost" color="neutral" @click="close">
          Cancel
        </u-button>

        <u-button
          :disabled="disabled"
          :loading="loading"
          @click="handleConfirm"
        >
          {{ confirmLabel }}
        </u-button>
      </div>
    </template>
  </u-modal>
</template>

<script setup lang="ts">
const open = defineModel<boolean>('open', { required: true });
const name = defineModel<string>('name', { required: true });

withDefaults(
  defineProps<{
    title: string;
    confirmLabel: string;
    placeholder?: string;
    error?: string;
    disabled?: boolean;
    loading?: boolean;
  }>(),
  { disabled: false, loading: false }
);

const emit = defineEmits<{
  confirm: [];
}>();

function handleConfirm() {
  emit('confirm');
}

function close() {
  open.value = false;
}
</script>
