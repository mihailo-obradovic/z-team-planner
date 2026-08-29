import { z } from 'zod';

import type { SerializedBuild } from '@/types/build';

export const ErrorDetailSchema = z.object({
  path: z.string(),
  message: z.string()
});

export type ErrorDetail = z.infer<typeof ErrorDetailSchema>;

export const SerializedBuildSchema = z.custom<SerializedBuild>(
  isSerializedBuild,
  { message: 'Unrecognised build document' }
);

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
