import { useQueryCache } from '@pinia/colada';

import { BUILDS_ROOT } from '@/services/queries/useBuildQueries';
import { meQueryKeys } from '@/services/queries/useMeQueries';

import type { Pinia } from 'pinia';

const USER_SCOPED_ROOTS = [BUILDS_ROOT, meQueryKeys.fetchMe];

export function clearUserScopedCache(pinia?: Pinia): void {
  const queryCache = useQueryCache(pinia);

  for (const key of USER_SCOPED_ROOTS) {
    for (const entry of queryCache.getEntries({ key })) {
      queryCache.cancel(entry);

      // ! A mounted query holds its entry and never looks it up again, so removing an active one orphans it: it keeps the outgoing user's data, and later invalidations miss it.
      if (entry.active) {
        queryCache.setEntryState(entry, {
          status: 'pending',
          data: undefined,
          error: null
        });
        entry.placeholderData = undefined;
        queryCache.invalidate(entry);
      } else {
        queryCache.remove(entry);
      }
    }
  }
}
