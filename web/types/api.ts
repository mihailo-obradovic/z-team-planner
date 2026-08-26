import { z } from 'zod';

import type { SerializedBuild } from '@/types/build';

// * One field-level failure from a 422. Feature 005 sends `details` on 422 only.
export const ErrorDetailSchema = z.object({
  path: z.string(),
  message: z.string()
});

export type ErrorDetail = z.infer<typeof ErrorDetailSchema>;

/**
 * The stored build document.
 *
 * Deliberately `z.custom` rather than a modelled schema: `SerializedBuild` is feature 001's
 * hand-written, protected format, and the server has already validated this payload against
 * the same rules. Re-describing it here would create a second definition to keep in step.
 */
export const SerializedBuildSchema = z.custom<SerializedBuild>(
  (value) =>
    typeof value === 'object' &&
    value !== null &&
    (value as { v?: unknown }).v === 1,
  { message: 'Unsupported build format version' }
);

// * Timestamps are UTC ISO-8601 with `Z` (feature 005); kept as strings — nothing formats them
// * here, and parsing to Date would make the ETag comparison lossy.
export const BuildSummarySchema = z.object({
  id: z.uuid(),
  name: z.string(),
  format_version: z.number(),
  created_at: z.string(),
  updated_at: z.string()
});

export const BuildSchema = BuildSummarySchema.extend({
  data: SerializedBuildSchema
});

// * The public read: never the owner (feature 005).
export const PublicBuildSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  data: SerializedBuildSchema,
  updated_at: z.string()
});

export const BuildListSchema = z.object({
  items: z.array(BuildSummarySchema),
  total: z.number(),
  page: z.number(),
  page_size: z.number()
});

export const ImportResultSchema = z.object({
  index: z.number(),
  status: z.enum(['created', 'invalid']),
  id: z.uuid().optional(),
  name: z.string().optional(),
  errors: z.array(ErrorDetailSchema).optional()
});

export const ImportReportSchema = z.array(ImportResultSchema);

export const MeSchema = z.object({
  display_name: z.string(),
  email: z.string(),
  created_at: z.string(),
  build_count: z.number()
});

export type BuildSummary = z.infer<typeof BuildSummarySchema>;
export type Build = z.infer<typeof BuildSchema>;
export type PublicBuild = z.infer<typeof PublicBuildSchema>;
export type BuildList = z.infer<typeof BuildListSchema>;
export type ImportResult = z.infer<typeof ImportResultSchema>;
export type ImportReport = z.infer<typeof ImportReportSchema>;
export type Me = z.infer<typeof MeSchema>;

// * Request payloads stay hand-written: there is no response to infer them from and nothing
// * parses them at runtime (stacks/frontend/nuxt/validation.md).
export type CreateBuildPayload = {
  name: string;
  data: SerializedBuild;
};

export type UpdateBuildPayload = {
  name?: string;
  data?: SerializedBuild;
};

export type ImportBuildsPayload = {
  builds: CreateBuildPayload[];
};
