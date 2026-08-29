import { z } from 'zod';

import type { SerializedBuild } from '@/types/build';

// * One field-level failure from a 422. Feature 005 sends `details` on 422 only.
export const ErrorDetailSchema = z.object({
  path: z.string(),
  message: z.string()
});

export type ErrorDetail = z.infer<typeof ErrorDetailSchema>;

// * The stored build document.
// * Deliberately `z.custom` rather than a modelled schema: `SerializedBuild` is feature 001's hand-written, protected format, and the server has already validated this payload against the same rules. Re-describing it here would create a second definition to keep in step.
export const SerializedBuildSchema = z.custom<SerializedBuild>(
  isSerializedBuild,
  { message: 'Unrecognised build document' }
);

// * Timestamps are UTC ISO-8601 with `Z` (feature 005); kept as strings — nothing formats them here, and parsing to Date would make the ETag comparison lossy.
export const CloudBuildSummarySchema = z.object({
  id: z.uuid(),
  name: z.string(),
  format_version: z.number(),
  created_at: z.string(),
  updated_at: z.string()
});

export const CloudBuildSchema = CloudBuildSummarySchema.extend({
  data: SerializedBuildSchema
});

export const SharedBuildSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  data: SerializedBuildSchema,
  updated_at: z.string()
});

// * `total` is kept though nothing renders it yet: it is the only value that can say "18 of 20" without counting an array, and adding it back later would be a second contract change.
export const CloudBuildListSchema = z.object({
  items: z.array(CloudBuildSummarySchema),
  total: z.number()
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

export type CloudBuildSummary = z.infer<typeof CloudBuildSummarySchema>;
export type CloudBuild = z.infer<typeof CloudBuildSchema>;
export type SharedBuild = z.infer<typeof SharedBuildSchema>;
export type CloudBuildList = z.infer<typeof CloudBuildListSchema>;
export type ImportResult = z.infer<typeof ImportResultSchema>;
export type ImportReport = z.infer<typeof ImportReportSchema>;
export type Me = z.infer<typeof MeSchema>;

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
