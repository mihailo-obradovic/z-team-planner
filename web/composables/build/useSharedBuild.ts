import { useFetchSharedBuild } from '@/services/queries/useSharedQueries';

import type { ErrorPageData } from '@/types/errorPage';

const NOT_FOUND = 404;

// * The shared read behind `/b/{id}`, with its failure made a page-level outcome: a share link that cannot load has nothing else to show (feature 007).
export function useSharedBuild(id: Ref<string>) {
  const query = useFetchSharedBuild(id, {
    // * Silenced because the error page is the message, and a toast over it would say the same thing twice.
    errorHandling: { suppressToasts: 'all' }
  });

  watch(query.error, (error) => {
    // * A read that fails behind a build already on screen costs the visitor nothing, so what is rendered stays.
    if (!error || query.data.value) {
      return;
    }

    const statusCode = (error as { statusCode?: number }).statusCode;

    // ! A dead share link is the central policy's to raise, with its own heading. Raising here too would replace "Build not found" with the generic wording.
    if (statusCode === NOT_FOUND) {
      return;
    }

    // * A read that never got an answer has no status, and says so rather than borrow a server's.
    const data: ErrorPageData | undefined = statusCode
      ? undefined
      : { status: 'unknown' };

    showError(createError({ statusCode, data, fatal: true }));
  });

  return query;
}
