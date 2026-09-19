import type { ErrorDetail } from '@/types/api';

type ValidationErrorBody = {
  data?: { error?: { details?: ErrorDetail[] } };
};

export function useValidationErrors(error: Ref<unknown>) {
  return computed<Record<string, string[]>>(() => {
    const details = (error.value as ValidationErrorBody | null)?.data?.error
      ?.details;

    if (!details) {
      return {};
    }

    return details.reduce<Record<string, string[]>>((accumulator, detail) => {
      const field = detail.path.split('.').pop() ?? detail.path;

      accumulator[field] = [...(accumulator[field] ?? []), detail.message];

      return accumulator;
    }, {});
  });
}
