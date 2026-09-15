import type { z } from 'zod';

// * A mismatch is a developer error, not a user's: the Zod issues go to the console, and the user gets a generic message rather than a validation dump.
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
