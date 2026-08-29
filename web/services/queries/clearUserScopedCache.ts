import { useQueryCache } from '@pinia/colada';

import { BUILDS_ROOT } from '@/services/queries/useBuildQueries';
import { meQueryKeys } from '@/services/queries/useMeQueries';

import type { Pinia } from 'pinia';

// * Everything only a signed-in user could see. Both roots, because both outlive the sign-out.
const USER_SCOPED_ROOTS = [BUILDS_ROOT, meQueryKeys.fetchMe];

// * Drop the signed-in user's server state when they sign out (feature 006: the other tab's
// * queries disable and its list clears).
// ! Removal, not `invalidateQueries`: invalidation marks an entry stale but leaves its data in
// ! place, and `useAppQuery` deliberately holds previous data across a key change — so the header
// ! would go on listing the last account's builds. On a shared browser the next person would see
// ! them until their own list landed.
// ! No `active: false` filter either. The entries that matter are exactly the mounted ones, so
// ! skipping them is what would leave the list on screen. They are recreated empty on the next
// ! read and stay empty, because every user-scoped query is gated on `isSignedIn`.
// * Takes the Pinia instance because the caller is an `onAuthStateChanged` callback, which fires
// * long after plugin setup, when there is no active instance to infer.
export function clearUserScopedCache(pinia?: Pinia): void {
  const queryCache = useQueryCache(pinia);

  for (const key of USER_SCOPED_ROOTS) {
    for (const entry of queryCache.getEntries({ key })) {
      queryCache.cancel(entry);
      queryCache.remove(entry);
    }
  }
}
