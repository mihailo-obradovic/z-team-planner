type OnSettled<TData, TVars, TError> = NonNullable<
  AppMutationOptions<TData, TVars, TError>['onSettled']
>;

export function chainOnSettled<TData, TVars, TError>(
  internal: OnSettled<TData, TVars, TError>,
  callerHook: OnSettled<TData, TVars, TError> | undefined
): OnSettled<TData, TVars, TError> {
  return async (data, error, vars, context) => {
    await internal(data, error, vars, context);
    await callerHook?.(data, error, vars, context);
  };
}
