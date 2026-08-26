<template>
  <u-modal v-model:open="deleteAccountOpen" title="Delete your account">
    <template #body>
      <div class="flex flex-col gap-4">
        <p class="text-sm text-muted">
          {{ summary }}
        </p>

        <!-- ! Not a detail: a share link that stops working is visible to people who are not
             ! the account holder, and this is the only moment they can be warned about. -->
        <p v-if="hasBuilds" class="text-sm text-muted">
          Their share links will stop working.
        </p>

        <p class="text-sm text-muted">
          Builds saved in this browser are not affected. This cannot be undone.
        </p>
      </div>
    </template>

    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <u-button
          variant="ghost"
          color="neutral"
          @click="deleteAccountOpen = false"
        >
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

const { deleteAccountOpen } = useAccountDialogs();

// * Only while the dialog is open: the count is what this dialog exists to say, and nothing
// * else in the app reads the profile, so fetching it on every sign-in would buy nothing.
const { data: me, isPending } = useFetchMe({
  enabled: () => isSignedIn.value && deleteAccountOpen.value
});

const buildCount = computed(() => me.value?.build_count ?? 0);

const hasBuilds = computed(() => buildCount.value > 0);

const summary = computed(() => {
  if (isPending.value) {
    return 'Deleting your account removes it and every build saved to it.';
  }

  return hasBuilds.value
    ? `Deleting your account removes it and the ${buildCount.value} build${buildCount.value === 1 ? '' : 's'} saved to it.`
    : 'Deleting your account removes it. There are no builds saved to it.';
});

const { mutate: deleteAccount, isLoading: isDeleting } = useDeleteMe({
  onSuccess: async () => {
    deleteAccountOpen.value = false;
    // * Signing out only after the server confirms: a failed delete must leave the user
    // * signed in, with the account they still have (feature 004, Error Handling).
    await signOut();
    toast.add({ title: 'Your account has been deleted', color: 'success' });
  }
});

function handleDelete() {
  deleteAccount();
}
</script>
