import type { Ref } from 'vue';

import {
  handleApiError,
  type ErrorHandlingOptions
} from '@/utils/handleApiError';

/**
 * Watches a query or mutation's error ref and routes it through the central policy.
 *
 * Shared by `useAppQuery` and `useAppMutation` so there is exactly one place where an API
 * failure becomes a toast, a dialog, or a 404 page.
 */
export function useApiErrorWatcher(
  error: Ref<unknown>,
  errorHandling: ErrorHandlingOptions = {}
): void {
  // * A composable called outside a component setup has no owner to bind a watcher to, and
  // * registering one anyway would leak it. Skipping is correct: nothing renders the result.
  if (!getCurrentInstance()) {
    return;
  }

  const route = useRoute();
  const toast = useToast();
  const { resetUser } = useAuthStore();

  watch(error, (next) => {
    if (!next) {
      return;
    }

    handleApiError(
      next,
      {
        routePath: route.path,
        resetUser,
        showToast: (message) => toast.add({ title: message, color: 'error' }),
        // * `createError` with fatal renders the error page rather than navigating away, so
        // * the URL keeps pointing at the share link that failed.
        showNotFoundPage: () =>
          showError(
            createError({
              statusCode: 404,
              statusMessage: 'Build not found',
              fatal: true
            })
          ),
        // * Filled in with the conflict dialog when the build manager lands (feature 006).
        showConflictDialog: () => {}
      },
      errorHandling
    );
  });
}
