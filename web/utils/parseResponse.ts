import type { z } from 'zod';

/**
 * Parse an API response against its schema.
 *
 * A failure here means the API changed shape or the schema is wrong — a developer error, not
 * a user error. The Zod issue is logged for a developer and a generic message is thrown, so
 * the central policy shows the user something sane rather than a validation dump.
 */
export function parseResponse<TSchema extends z.ZodType>(
  schema: TSchema,
  payload: unknown
): z.infer<TSchema> {
  const result = schema.safeParse(payload);

  if (!result.success) {
    console.error(
      'API response did not match its schema.',
      result.error.issues
    );
    throw new Error('Something went wrong. Please try again.');
  }

  return result.data;
}
