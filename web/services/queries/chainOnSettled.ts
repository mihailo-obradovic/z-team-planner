import type { AppMutationOptions } from '@/composables/useAppMutation';

type OnSettled<TData, TVars, TError> = NonNullable<
  AppMutationOptions<TData, TVars, TError>['onSettled']
>;

// * Run this hook's own work, then the caller's.
// * Two rules live here so every mutation gets them right in one place: the internal work is **awaited** before the caller's hook runs — otherwise a page's `onSettled` closes its dialog while the list is still stale — and the caller's hook is chained rather than overwritten.
export function chainOnSettled<TData, TVars, TError>(
  internal: OnSettled<TData, TVars, TError>,
  callerHook: OnSettled<TData, TVars, TError> | undefined
): OnSettled<TData, TVars, TError> {
  return async (data, error, vars, context) => {
    await internal(data, error, vars, context);
    await callerHook?.(data, error, vars, context);
  };
}
