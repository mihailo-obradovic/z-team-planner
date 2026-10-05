type OnSettled<
  TData,
  TVars,
  TError,
  TContext extends Record<any, any>
> = NonNullable<
  AppMutationOptions<TData, TVars, TError, TContext>['onSettled']
>;

// * `TContext` carries an optimistic `onMutate`'s snapshot through to both hooks; a mutation without one infers it empty.
export function chainOnSettled<
  TData,
  TVars,
  TError,
  TContext extends Record<any, any>
>(
  internal: OnSettled<TData, TVars, TError, TContext>,
  callerHook: OnSettled<TData, TVars, TError, TContext> | undefined
): OnSettled<TData, TVars, TError, TContext> {
  return async (data, error, vars, context) => {
    await internal(data, error, vars, context);
    await callerHook?.(data, error, vars, context);
  };
}
