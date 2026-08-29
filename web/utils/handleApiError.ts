import type { ErrorDetail } from '@/types/api';

export type ErrorHandlingOptions = {
  // * `all` silences every toast for this call; `validation` silences only the `422`, so a 500 during the same submit still surfaces.
  suppressToasts?: 'all' | 'validation';
};

export type ApiErrorContext = {
  routePath: string;
  resetUser: () => void;
  showToast: (message: string) => void;
  showNotFoundPage: () => void;
  showConflictDialog: (error: unknown) => void;
};

type ApiErrorBody = {
  error?: { code?: string; message?: string; details?: ErrorDetail[] };
};

type StatusError = {
  statusCode?: number;
  message?: string;
  data?: ApiErrorBody;
};

const GENERIC_MESSAGE = 'Something went wrong. Please try again.';

// * A WeakSet, so an entry disappears with the error object itself — a plain Set would pin every error the app has ever handled for the lifetime of the page.
const handledErrors = new WeakSet<object>();

// * Statuses come from feature 006's central policy. Two never toast: `412` opens the conflict dialog, and `422` renders inline on the field that failed.
export function handleApiError(
  error: unknown,
  context: ApiErrorContext,
  options: ErrorHandlingOptions = {}
): void {
  if (typeof error === 'object' && error !== null) {
    if (handledErrors.has(error)) {
      return;
    }

    handledErrors.add(error);
  }

  const status = asStatusError(error)?.statusCode;
  const toast = (message: string) => {
    if (options.suppressToasts !== 'all') {
      context.showToast(message);
    }
  };

  if (status === 401) {
    // * Reached only after the fetcher's refresh-and-retry already failed. No redirect: no route in this app requires authentication (feature 006).
    context.resetUser();
    toast('Your session has expired. Please sign in again.');

    return;
  }

  if (status === 404) {
    // * A share link to a deleted build is a page-level outcome, not a passing message.
    if (context.routePath.startsWith('/b/')) {
      context.showNotFoundPage();

      return;
    }

    toast(extractMessage(error));

    return;
  }

  if (status === 412) {
    // ! Never a toast. The other device's build has to be shown so the user can choose between reloading theirs and saving mine as new.
    context.showConflictDialog(error);

    return;
  }

  if (status === 422) {
    // ! Never a toast when the form renders it inline; `validation` is narrower than `all` on purpose, so a 500 during the same submit still surfaces.
    if (!options.suppressToasts) {
      toast(extractMessage(error));
    }

    return;
  }

  toast(extractMessage(error));
}

// * Most specific first: what the API said, then the transport-level line, then a generic fallback.
export function extractMessage(error: unknown): string {
  const candidate = asStatusError(error);

  return (
    candidate?.data?.error?.message || candidate?.message || GENERIC_MESSAGE
  );
}

function asStatusError(error: unknown): StatusError | null {
  return typeof error === 'object' && error !== null
    ? (error as StatusError)
    : null;
}
