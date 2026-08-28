import { type UseQueryOptions, useQuery } from '@pinia/colada';

import type { ErrorHandlingOptions } from '@/utils/handleApiError';

export type AppQueryOptions<TData, TError = Error> = UseQueryOptions<
  TData,
  TError
> & {
  errorHandling?: ErrorHandlingOptions;
};

// * Every query in this app goes through here, so failure handling is attached in one place rather than remembered at each call site.
export function useAppQuery<TData, TError = Error>(
  options: AppQueryOptions<TData, TError>
) {
  const { errorHandling, ...queryOptions } = options;

  const query = useQuery<TData, TError>({
    // * Keeps the previous page's data visible across a key change instead of flashing empty.
    placeholderData: (previous) => previous,
    ...queryOptions
  });

  useApiErrorWatcher(query.error, errorHandling);

  return query;
}
