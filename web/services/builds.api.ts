import {
  CloudBuildListSchema,
  CloudBuildSchema,
  ImportReportSchema,
  type CloudBuild,
  type CloudBuildList,
  type CreateBuildPayload,
  type ImportBuildsPayload,
  type ImportReport,
  type UpdateBuildPayload
} from '@/types/api';

export async function fetchBuilds(
  signal?: AbortSignal
): Promise<CloudBuildList> {
  return parseResponse(
    CloudBuildListSchema,
    await fetcher('/builds', { signal })
  );
}

export async function fetchBuild(
  id: string,
  signal?: AbortSignal
): Promise<CloudBuild> {
  return parseResponse(
    CloudBuildSchema,
    await fetcher(`/builds/${id}`, { signal })
  );
}

export async function createBuild(
  payload: CreateBuildPayload,
  idempotencyKey: string
): Promise<CloudBuild> {
  return parseResponse(
    CloudBuildSchema,
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
): Promise<CloudBuild> {
  return parseResponse(
    CloudBuildSchema,
    await fetcher(`/builds/${id}`, {
      method: 'PATCH',
      body: payload,
      headers: { 'If-Match': etag }
    })
  );
}

export async function deleteBuild(id: string): Promise<void> {
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
