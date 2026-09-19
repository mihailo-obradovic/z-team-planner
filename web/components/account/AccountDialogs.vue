<template>
  <u-modal
    v-model:open="deleteAccountOpen"
    title="Delete your account"
    description="Removes your account and every build saved to it."
  >
    <template #body>
      <div class="flex flex-col gap-4">
        <!-- ! Every variant reserves the row: the count arrives after the dialog opens, just above the Delete button. -->
        <div class="grid">
          <p
            v-for="variant in summaryVariants"
            :key="variant"
            class="invisible col-start-1 row-start-1 text-sm text-muted"
            aria-hidden="true"
          >
            {{ variant }}
          </p>

          <p class="col-start-1 row-start-1 text-sm text-muted">
            {{ summary }}
          </p>
        </div>

        <p class="text-sm text-muted">
          Builds saved in this browser are not affected. This cannot be undone.
        </p>
      </div>
    </template>

    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <u-button variant="ghost" color="neutral" @click="handleCancel">
          Cancel
        </u-button>

        <u-button
          color="error"
          :loading="isDeleting"
          :disabled="isPending"
          @click="handleDelete"
        >
          Delete account
        </u-button>
      </div>
    </template>
  </u-modal>
</template>

<script setup lang="ts">
import { useDeleteMe, useFetchMe } from '@/services/queries/useMeQueries';

const toast = useToast();

const { isSignedIn } = storeToRefs(useAuthStore());

const { signOut } = useAuth();

const { deleteAccountOpen } = useDialogs();

const { data: me, isPending } = useFetchMe({
  enabled: () => isSignedIn.value && deleteAccountOpen.value
});

const { mutate: deleteAccount, isLoading: isDeleting } = useDeleteMe({
  onSuccess: async () => {
    deleteAccountOpen.value = false;
    await signOut();
    toast.add({ title: 'Your account has been deleted', color: 'success' });
  }
});

const buildCount = computed(() => me.value?.build_count ?? 0);

const summary = computed(() =>
  summaryText(isPending.value ? 'pending' : buildCount.value)
);

// * A two-digit count stands in for the widest loaded variant.
const summaryVariants = [
  summaryText('pending'),
  summaryText(0),
  summaryText(99)
];

// * One source, so the shown summary and the reserved variants can't drift.
function summaryText(count: number | 'pending'): string {
  if (count === 'pending') {
    return 'Deleting your account removes it and every build saved to it.';
  }

  if (count === 0) {
    return 'Deleting your account removes it. There are no builds saved to it.';
  }

  const builds = count === 1 ? '1 build' : `${count} builds`;

  return `Deleting your account removes it and the ${builds} saved to it. Their share links will stop working.`;
}

function handleCancel() {
  deleteAccountOpen.value = false;
}

function handleDelete() {
  deleteAccount();
}
</script>
