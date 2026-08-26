import { z } from 'zod';

// * One field-level failure from a 422. Feature 005 sends these on 422 only.
export const ErrorDetailSchema = z.object({
  path: z.string(),
  message: z.string()
});

export type ErrorDetail = z.infer<typeof ErrorDetailSchema>;
