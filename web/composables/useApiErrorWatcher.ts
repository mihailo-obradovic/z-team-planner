import type { Ref } from 'vue';

import {
  handleApiError,
  type ErrorHandlingOptions
} from '@/utils/handleApiError';

// * Watches a query or mutation's error ref and routes it through the central policy.
// * Shared by `useAppQuery` and `useAppMutation` so there is exactly one place where an API failure becomes a toast, a dialog, or a 404 page.
export function useApiErrorWatcher(
  error: Ref<unknown>,
  errorHandling: ErrorHandlingOptions = {}
): void {
  // * A composable called outside a component setup has no owner to bind a watcher to, and registering one anyway would leak it. Skipping is correct: nothing renders the result.
  if (!getCurrentInstance()) {
    return;
  }

  const route = useRoute();
  const toast = useToast();
  const { resetUser } = useAuthStore();
  const { openConflict } = useBuildDialogs();

  function showToast(message: string) {
    toast.add({ title: message, color: 'error' });
  }

  watch(error, (next) => {
    if (!next) {
      return;
    }

    handleApiError(
      next,
      {
        routePath: route.path,
        resetUser,
        showToast,
        // * `createError` with fatal renders the error page rather than navigating away, so the URL keeps pointing at the share link that failed.
        // * The heading travels in `data`, which is where the error page reads it from (feature 009) — `statusMessage` is Nuxt's own for unmatched routes.
        showNotFoundPage: () =>
          showError(
            createError({
              statusCode: 404,
              statusMessage: 'Build not found',
              data: { heading: 'Build not found' },
              fatal: true
            })
          ),
        showConflictDialog: (conflict) => {
          const body = (conflict as { data?: unknown } | null)?.data;

          // * A 412 body that will not parse falls through to the generic toast: without the other device's build there is nothing for the dialog to offer (feature 008).
          if (!openConflict(body)) {
            showToast(extractMessage(conflict));
          }
        }
      },
      errorHandling
    );
  });
}
