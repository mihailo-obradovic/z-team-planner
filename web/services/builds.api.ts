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

export async function fetchBuilds(): Promise<BuildList> {
  return parseResponse(BuildListSchema, await fetcher('/builds'));
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
