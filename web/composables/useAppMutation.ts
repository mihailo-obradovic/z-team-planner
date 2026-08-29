import { type UseMutationOptions, useMutation } from '@pinia/colada';

export type AppMutationOptions<
  TData,
  TVars,
  TError = Error
> = UseMutationOptions<TData, TVars, TError> & {
  errorHandling?: ErrorHandlingOptions;
};

// * Every mutation goes through here. A component never wraps a mutation in try-catch; the watcher below turns a failure into whatever the central policy says it should be.
export function useAppMutation<TData, TVars, TError = Error>(
  options: AppMutationOptions<TData, TVars, TError>
) {
  const { errorHandling, ...mutationOptions } = options;

  const mutation = useMutation<TData, TVars, TError>(mutationOptions);

  useApiErrorWatcher(mutation.error, errorHandling);

  return mutation;
}
