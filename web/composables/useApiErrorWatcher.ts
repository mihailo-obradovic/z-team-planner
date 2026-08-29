export function useApiErrorWatcher(
  error: Ref<unknown>,
  errorHandling: ErrorHandlingOptions = {}
): void {
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

          if (!openConflict(body)) {
            showToast(extractMessage(conflict));
          }
        }
      },
      errorHandling
    );
  });
}
