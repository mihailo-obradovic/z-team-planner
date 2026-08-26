import {
  BuildListSchema,
  BuildSchema,
  ImportReportSchema,
  type Build,
  type BuildList,
  type CreateBuildPayload,
  type ImportBuildsPayload,
  type ImportReport,
  type UpdateBuildPayload
} from '@/types/api';

// * Pure: one function per feature 005 endpoint, no store access, no toasts, no cache writes.

export async function fetchBuilds(page = 1, pageSize = 20): Promise<BuildList> {
  return parseResponse(
    BuildListSchema,
    await fetcher('/builds', { query: { page, page_size: pageSize } })
  );
}

export async function fetchBuild(id: string): Promise<Build> {
  return parseResponse(BuildSchema, await fetcher(`/builds/${id}`));
}

export async function createBuild(
  payload: CreateBuildPayload,
  idempotencyKey: string
): Promise<Build> {
  return parseResponse(
    BuildSchema,
    await fetcher('/builds', {
      method: 'POST',
      body: payload,
      headers: { 'Idempotency-Key': idempotencyKey }
    })
  );
}

export async function updateBuild(
  id: string,
  payload: UpdateBuildPayload,
  etag: string
): Promise<Build> {
  return parseResponse(
    BuildSchema,
    await fetcher(`/builds/${id}`, {
      method: 'PATCH',
      body: payload,
      // * The build's `updated_at` from the last read; the server rejects a stale one with 412.
      headers: { 'If-Match': etag }
    })
  );
}

export async function deleteBuild(id: string): Promise<void> {
  // * 204, no body — nothing to parse.
  await fetcher(`/builds/${id}`, { method: 'DELETE' });
}

export async function importBuilds(
  payload: ImportBuildsPayload,
  idempotencyKey: string
): Promise<ImportReport> {
  return parseResponse(
    ImportReportSchema,
    await fetcher('/builds/import', {
      method: 'POST',
      body: payload,
      headers: { 'Idempotency-Key': idempotencyKey }
    })
  );
}
