import type { Ref } from 'vue';

import type { ErrorDetail } from '@/types/api';

type ValidationErrorBody = {
  data?: { error?: { details?: ErrorDetail[] } };
};

/**
 * Turn a mutation's error into the field-keyed shape Regle takes as external errors.
 *
 * Feature 005 sends `details` on `422` only, each entry a `path` and a `message`, so anything
 * else yields an empty map and the form shows nothing.
 */
export function useValidationErrors(error: Ref<unknown>) {
  return computed<Record<string, string[]>>(() => {
    const details = (error.value as ValidationErrorBody | null)?.data?.error
      ?.details;

    if (!details) {
      return {};
    }

    return details.reduce<Record<string, string[]>>((accumulator, detail) => {
      // * `data.name` and `name` are the same field to a form; the server's path is dotted and
      // * the form's key is the last segment.
      const field = detail.path.split('.').pop() ?? detail.path;

      accumulator[field] = [...(accumulator[field] ?? []), detail.message];

      return accumulator;
    }, {});
  });
}
