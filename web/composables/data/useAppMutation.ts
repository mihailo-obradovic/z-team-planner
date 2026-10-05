import {
  type _EmptyObject,
  type UseMutationOptions,
  useMutation
} from '@pinia/colada';

// * `TContext` is what an optimistic `onMutate` returns; it defaults to Pinia Colada's own empty context, so a mutation without one never names it.
export type AppMutationOptions<
  TData,
  TVars,
  TError = Error,
  TContext extends Record<any, any> = _EmptyObject
> = UseMutationOptions<TData, TVars, TError, TContext> & {
  errorHandling?: ErrorHandlingOptions;
};

// * Every mutation goes through here. A component never wraps a mutation in try-catch; the watcher below turns a failure into whatever the central policy says it should be.
export function useAppMutation<
  TData,
  TVars,
  TError = Error,
  TContext extends Record<any, any> = _EmptyObject
>(options: AppMutationOptions<TData, TVars, TError, TContext>) {
  const { errorHandling, ...mutationOptions } = options;

  const mutation = useMutation<TData, TVars, TError, TContext>(mutationOptions);

  useApiErrorWatcher(mutation.error, errorHandling);

  return mutation;
}
